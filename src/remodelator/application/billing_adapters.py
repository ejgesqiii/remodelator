from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from sqlalchemy.orm import Session

from remodelator.application import service
from remodelator.application.billing_policy import billing_provider_status_payload
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


from remodelator.application.stripe_service import StripeService


class StripeBillingAdapter:
    provider_name = "stripe"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        # Initialize the low-level service encapsulation
        self._stripe_service = StripeService(settings)

    def execute(
        self,
        session: Session,
        user_id: str,
        command: BillingCommand,
    ) -> dict[str, str]:
        # Pre-flight check
        status = billing_provider_status_payload(self._settings)
        if not status.get("ready_for_live"):
            blocker = status.get("blocker_reason") or "Stripe live adapter implementation is not ready."
            raise CriticalDependencyError(f"Billing provider 'stripe' is unavailable: {blocker}")

        # Fetch internal user
        user = session.query(service.User).filter_by(id=user_id).first()
        if not user:
            raise ValueError("User not found.")

        # Ensure they have a Stripe Customer ID
        customer_id = self._stripe_service.get_or_create_customer(user)
        if user.stripe_customer_id != customer_id:
            user.stripe_customer_id = customer_id
            session.commit()

        # Route by command event type
        if command.event_type == "simulate_subscription":
            # This is an annual subscription: generate a Checkout Session URL
            # In a real app, success/cancel URLs would be parameterized or config-driven
            url = self._stripe_service.create_checkout_session(
                customer_id=customer_id,
                amount=command.amount,
                currency=self._settings.billing_currency,
                success_url=f"{self._settings.cors_allowed_origins[0]}/billing?checkout=success",
                cancel_url=f"{self._settings.cors_allowed_origins[0]}/billing?checkout=canceled",
                idempotency_key=command.idempotency_key,
            )
            return {
                "status": "checkout_session_created",
                "checkout_url": url,
                "message": "Redirecting to Stripe Checkout.",
            }

        elif command.event_type == "simulate_estimate_charge":
            # This is a real-time usage charge: attempt to capture immediately
            intent = self._stripe_service.capture_usage_charge(
                customer_id=customer_id,
                amount=command.amount,
                currency=self._settings.billing_currency,
                description=command.details or "Estimate pricing run usage",
                idempotency_key=command.idempotency_key,
            )
            
            # Record it immediately in our ledger as 'usage_charge' since we captured it synchronously
            service.record_billing_event(
                session, 
                user_id, 
                "usage_charge", 
                command.amount, 
                details=f"Stripe PaymentIntent: {intent.id}",
                idempotency_key=command.idempotency_key
            )
            
            return {
                "status": "charge_succeeded",
                "payment_intent": intent.id,
                "message": "Usage charge captured successfully.",
            }
        else:
            raise ValueError(f"Unsupported Stripe command event type: {command.event_type}")


def resolve_billing_adapter(settings: Settings) -> BillingAdapter:
    provider = settings.billing_provider
    if provider == "simulation":
        return SimulationBillingAdapter()
    if provider == "stripe":
        return StripeBillingAdapter(settings)
    raise CriticalDependencyError(f"Unsupported billing provider '{provider}'.")
