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


class StripeBillingAdapter:
    provider_name = "stripe"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def execute(
        self,
        session: Session,
        user_id: str,
        command: BillingCommand,
    ) -> dict[str, str]:
        _ = (session, user_id, command)
        status = billing_provider_status_payload(self._settings)
        blocker = status.get("blocker_reason") or "Stripe live adapter implementation is not available."
        raise CriticalDependencyError(f"Billing provider 'stripe' is unavailable: {blocker}")


def resolve_billing_adapter(settings: Settings) -> BillingAdapter:
    provider = settings.billing_provider
    if provider == "simulation":
        return SimulationBillingAdapter()
    if provider == "stripe":
        return StripeBillingAdapter(settings)
    raise CriticalDependencyError(f"Unsupported billing provider '{provider}'.")
