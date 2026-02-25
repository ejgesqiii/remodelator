from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from sqlalchemy.orm import Session

from remodelator.application import service
from remodelator.application.billing_policy import billing_provider_status_payload
from remodelator.application.stripe_service import StripeService
from remodelator.config import Settings
from remodelator.interfaces.api.errors import CriticalDependencyError


@dataclass(frozen=True)
class BillingCommand:
    event_type: str
    amount: Decimal
    details: str = ""
    idempotency_key: str | None = None


class BillingAdapter(Protocol):
    provider_name: str

    def execute(
        self,
        session: Session,
        user_id: str,
        command: BillingCommand,
    ) -> dict[str, str]:
        ...


class SimulationBillingAdapter:
    provider_name = "simulation"

    def execute(
        self,
        session: Session,
        user_id: str,
        command: BillingCommand,
    ) -> dict[str, str]:
        return service.simulate_billing_event(
            session,
            user_id,
            command.event_type,
            command.amount,
            command.details,
            idempotency_key=command.idempotency_key,
        )


class StripeBillingAdapter:
    provider_name = "stripe"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._stripe_service: StripeService | None = None

    def _get_stripe_service(self) -> StripeService:
        if self._stripe_service is None:
            self._stripe_service = StripeService(self._settings)
        return self._stripe_service

    def _redirect_base_url(self) -> str:
        if self._settings.cors_allowed_origins:
            return self._settings.cors_allowed_origins[0].rstrip("/")
        return "http://127.0.0.1:5173"

    def execute(
        self,
        session: Session,
        user_id: str,
        command: BillingCommand,
    ) -> dict[str, str]:
        status = billing_provider_status_payload(self._settings)
        if not status.get("adapter_ready"):
            blocker = status.get("blocker_reason") or "Stripe live adapter implementation is not ready."
            if "STRIPE_SECRET_KEY is not configured." in blocker:
                blocker = f"{blocker} Stripe API key is not configured."
            if "STRIPE_WEBHOOK_SECRET is not configured." in blocker:
                blocker = f"{blocker} Stripe webhook secret is not configured."
            raise CriticalDependencyError(f"Billing provider 'stripe' is unavailable: {blocker}")

        user = session.get(service.User, user_id)
        if not user:
            raise ValueError("User not found.")

        stripe_service = self._get_stripe_service()
        customer_id = stripe_service.get_or_create_customer(user)
        if user.stripe_customer_id != customer_id:
            existing_owner = (
                session.query(service.User)
                .filter(service.User.stripe_customer_id == customer_id, service.User.id != user.id)
                .one_or_none()
            )
            if existing_owner:
                existing_owner.stripe_customer_id = None
                existing_owner.stripe_subscription_id = None
                session.flush()
            user.stripe_customer_id = customer_id
            session.flush()

        command_type = command.event_type.strip().lower()
        if command_type in {"subscription", "simulate_subscription"}:
            redirect_base = self._redirect_base_url()
            url = stripe_service.create_checkout_session(
                customer_id=customer_id,
                amount=command.amount,
                currency=self._settings.billing_currency,
                success_url=f"{redirect_base}/billing?checkout=success",
                cancel_url=f"{redirect_base}/billing?checkout=canceled",
                idempotency_key=command.idempotency_key,
            )
            return {
                "status": "checkout_session_created",
                "checkout_url": url,
                "message": "Redirecting to Stripe Checkout.",
            }

        if command_type in {"estimate_charge", "simulate_estimate_charge", "usage_charge"}:
            intent = stripe_service.capture_usage_charge(
                customer_id=customer_id,
                amount=command.amount,
                currency=self._settings.billing_currency,
                description=command.details or "Estimate pricing run usage",
                idempotency_key=command.idempotency_key,
            )

            detail_suffix = f"Stripe PaymentIntent: {intent.id}"
            details = detail_suffix if not command.details else f"{command.details}; {detail_suffix}"
            service.record_billing_event(
                session,
                user_id,
                "usage_charge",
                command.amount,
                details=details,
                idempotency_key=command.idempotency_key,
                currency=self._settings.billing_currency,
            )

            return {
                "status": "charge_succeeded",
                "payment_intent": intent.id,
                "message": "Usage charge captured successfully.",
            }

        raise ValueError(f"Unsupported Stripe command event type: {command.event_type}")


def resolve_billing_adapter(settings: Settings) -> BillingAdapter:
    provider = settings.billing_provider
    if provider == "simulation":
        return SimulationBillingAdapter()
    if provider == "stripe":
        return StripeBillingAdapter(settings)
    raise CriticalDependencyError(f"Unsupported billing provider '{provider}'.")
