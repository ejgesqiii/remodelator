from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest

from remodelator.application import service
from remodelator.application.billing_adapters import SimulationBillingAdapter
from remodelator.application.billing_adapters import StripeBillingAdapter
from remodelator.application.billing_adapters import resolve_billing_adapter
from remodelator.application.billing_runtime import BillingCommand
from remodelator.application.billing_runtime import execute_billing_command
from remodelator.config import get_settings
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.errors import CriticalDependencyError


def test_resolve_billing_adapter_returns_simulation_adapter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "simulation")
    adapter = resolve_billing_adapter(get_settings())
    assert isinstance(adapter, SimulationBillingAdapter)


def test_resolve_billing_adapter_returns_stripe_adapter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")
    adapter = resolve_billing_adapter(get_settings())
    assert isinstance(adapter, StripeBillingAdapter)


def test_execute_billing_command_simulation_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "simulation")
    service.init_db()

    email = f"runtime-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Runtime Test User")
        result = execute_billing_command(
            session,
            user["user_id"],
            BillingCommand(event_type="subscription", amount=Decimal("1200.00"), details="runtime simulation"),
        )

    assert result["event_type"] == "subscription"
    assert result["amount"] == "1200.00"


def test_execute_billing_command_stripe_provider_fails_loud(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    service.init_db()

    email = f"runtime-stripe-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Runtime Stripe User")
        with pytest.raises(CriticalDependencyError, match="Billing provider 'stripe' is unavailable"):
            execute_billing_command(
                session,
                user["user_id"],
                BillingCommand(event_type="subscription", amount=Decimal("1200.00")),
            )
