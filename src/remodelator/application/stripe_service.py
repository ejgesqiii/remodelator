from __future__ import annotations

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

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

        kwargs: dict[str, Any] = {
            "amount": amount_cents,
            "currency": currency.lower(),
            "customer": customer_id,
            "description": description,
            "confirm": True,
            "automatic_payment_methods": {"enabled": True, "allow_redirects": "never"},
        }
        if idempotency_key:
            kwargs["idempotency_key"] = f"pi_{idempotency_key}"

        try:
            intent = stripe.PaymentIntent.create(**kwargs)
            return intent
        except stripe.error.CardError as e:  # type: ignore
            # Expose card errors cleanly
            raise ValueError(f"Payment failed: {e.user_message}") from e
        except stripe.error.StripeError as e:  # type: ignore
            raise RuntimeError(f"Stripe usage charge failed: {e.user_message or str(e)}") from e

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
