from __future__ import annotations

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from urllib.parse import urlparse

import stripe

from remodelator.config import Settings
from remodelator.infra.models import User
from remodelator.interfaces.api.errors import CriticalDependencyError

logger = logging.getLogger(__name__)


class StripeService:
    def __init__(self, settings: Settings, *, require_secret_key: bool = True) -> None:
        self.settings = settings
        if require_secret_key and not settings.stripe_secret_key:
            raise CriticalDependencyError("STRIPE_SECRET_KEY is not configured. Stripe API key is not configured.")
        if settings.stripe_secret_key:
            stripe.api_key = settings.stripe_secret_key
        # Use an explicit API version for stability
        stripe.api_version = settings.stripe_api_version

    @staticmethod
    def _to_cents(amount: Decimal) -> int:
        return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    @staticmethod
    def _is_http_url(candidate: str) -> bool:
        parsed = urlparse(candidate)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)

    def _resolve_payment_return_url(self) -> str:
        configured = (self.settings.stripe_payment_return_url or "").strip()
        if configured:
            if self._is_http_url(configured):
                return configured
            logger.warning("Invalid STRIPE_PAYMENT_RETURN_URL value '%s'; falling back to CORS/local URL.", configured)

        if self.settings.cors_allowed_origins:
            origin = self.settings.cors_allowed_origins[0].strip()
            if self._is_http_url(origin):
                return f"{origin.rstrip('/')}/billing?stripe_return=1"

        return "http://127.0.0.1:5173/billing?stripe_return=1"

    def get_or_create_customer(self, user: User) -> str:
        """
        Returns the Stripe Customer ID for a User.
        If they don't have one, creates it entirely in Stripe and returns the ID.
        Note: The caller is responsible for saving the ID back to the local DB if it's new.
        """
        if user.stripe_customer_id:
            return user.stripe_customer_id

        # Search Stripe first by email to prevent duplicates if DB was reset
        existing_customers = stripe.Customer.list(email=user.email, limit=1)
        if existing_customers.data:
            logger.info(f"Found existing Stripe customer for {user.email}")
            return existing_customers.data[0].id

        # Create new customer
        logger.info(f"Creating new Stripe customer for {user.email}")
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name or user.email,
            metadata={"internal_user_id": user.id},
        )
        return customer.id

    def create_checkout_session(
        self,
        customer_id: str,
        amount: Decimal,
        currency: str,
        success_url: str,
        cancel_url: str,
        idempotency_key: str | None = None,
    ) -> str:
        """
        Creates a Stripe Checkout Session for a one-time charge (e.g., Annual Subscription).
        Returns the checkout URL.
        """
        # Stripe expects integer amounts in cents
        amount_cents = self._to_cents(amount)
        if amount_cents <= 0:
            raise ValueError("Stripe checkout amount must be greater than zero.")

        kwargs: dict[str, Any] = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price_data": {
                        "currency": currency.lower(),
                        "product_data": {
                            "name": "Remodelator Annual License",
                            "description": "Full access to the estimating platform for one year.",
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            "mode": "payment",
            "payment_intent_data": {
                # Store the checkout payment method for later off-session usage charges.
                "setup_future_usage": "off_session",
            },
            "success_url": success_url,
            "cancel_url": cancel_url,
        }

        if idempotency_key:
            # We prefix the idempotency key so Stripe sees it as a unique 'Checkout' operation
            # versus our internal ledger idempotency key
            kwargs["idempotency_key"] = f"checkout_{idempotency_key}"

        session = stripe.checkout.Session.create(**kwargs)
        if not session.url:
            raise RuntimeError("Failed to generate Stripe checkout session URL.")
        return session.url

    def capture_usage_charge(
        self,
        customer_id: str,
        amount: Decimal,
        currency: str,
        description: str,
        idempotency_key: str | None = None,
    ) -> stripe.PaymentIntent:
        """
        Captures a real-time usage charge directly if the customer has a payment method on file.
        """
        amount_cents = self._to_cents(amount)
        if amount_cents <= 0:
            raise ValueError("Stripe usage charge amount must be greater than zero.")

        payment_method_id = self._resolve_reusable_payment_method(customer_id)
        if not payment_method_id:
            raise ValueError(
                "No reusable payment method is saved for this Stripe customer. "
                "Complete Stripe Checkout first, then retry the usage charge."
            )

        kwargs: dict[str, Any] = {
            "amount": amount_cents,
            "currency": currency.lower(),
            "customer": customer_id,
            "payment_method": payment_method_id,
            "description": description,
            "confirm": True,
            "off_session": True,
            "return_url": self._resolve_payment_return_url(),
        }
        if idempotency_key:
            kwargs["idempotency_key"] = f"pi_{idempotency_key}"

        try:
            intent = stripe.PaymentIntent.create(**kwargs)
            return intent
        except stripe.error.CardError as e:  # type: ignore
            # Expose card errors cleanly
            raise ValueError(f"Payment failed: {e.user_message}") from e
        except stripe.error.InvalidRequestError as e:  # type: ignore
            raise ValueError(e.user_message or str(e)) from e
        except stripe.error.StripeError as e:  # type: ignore
            raise RuntimeError(f"Stripe usage charge failed: {e.user_message or str(e)}") from e

    def _resolve_reusable_payment_method(self, customer_id: str) -> str | None:
        customer = stripe.Customer.retrieve(
            customer_id,
            expand=["invoice_settings.default_payment_method"],
        )

        invoice_settings = getattr(customer, "invoice_settings", None)
        default_payment_method = getattr(invoice_settings, "default_payment_method", None)
        if isinstance(default_payment_method, str) and default_payment_method.strip():
            return default_payment_method.strip()
        if getattr(default_payment_method, "id", None):
            return str(default_payment_method.id).strip()

        payment_methods = stripe.PaymentMethod.list(customer=customer_id, type="card", limit=1)
        if getattr(payment_methods, "data", None):
            payment_method = payment_methods.data[0]
            if getattr(payment_method, "id", None):
                return str(payment_method.id).strip()
        return None

    def verify_webhook_signature(self, payload: bytes, sig_header: str) -> stripe.Event:
        """
        Verifies and constructs a Webhook Event from Stripe.
        """
        if not self.settings.stripe_webhook_secret:
            raise CriticalDependencyError(
                "STRIPE_WEBHOOK_SECRET is not configured. Stripe webhook secret is not configured."
            )

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.settings.stripe_webhook_secret
            )
            return event
        except stripe.error.SignatureVerificationError as e:  # type: ignore
            logger.warning("Invalid Stripe webhook signature.")
            raise ValueError("Invalid webhook signature") from e
        except ValueError as e:
            logger.warning("Invalid Stripe webhook payload.")
            raise ValueError("Invalid payload") from e
