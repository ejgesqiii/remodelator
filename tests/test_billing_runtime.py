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
        with pytest.raises(CriticalDependencyError, match="Stripe API key is not configured."):
            execute_billing_command(
                session,
                user["user_id"],
                BillingCommand(event_type="subscription", amount=Decimal("1200.00")),
            )


def test_execute_billing_command_stripe_checkout_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")
    service.init_db()

    email = f"runtime-stripe-ok-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Stripe OK User")
        
        class MockStripeService:
            def __init__(self, *args, **kwargs) -> None:
                self.settings = get_settings()
            def get_or_create_customer(self, u: object) -> str:
                return "cus_mock_123"
            def create_checkout_session(self, *args, **kwargs) -> str:
                return "https://checkout.stripe.com/c/pay/cs_test_mock"
                
        monkeypatch.setattr("remodelator.application.billing_adapters.StripeService", MockStripeService)
        
        result = execute_billing_command(
            session,
            user["user_id"],
            BillingCommand(event_type="simulate_subscription", amount=Decimal("1200.00")),
        )
        
        assert result["status"] == "checkout_session_created"
        assert result["checkout_url"] == "https://checkout.stripe.com/c/pay/cs_test_mock"


def test_execute_billing_command_stripe_usage_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")
    service.init_db()

    email = f"runtime-stripe-usage-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Stripe Usage User")
        
        class MockIntent:
            id = "pi_mock_123"

        class MockStripeService:
            def __init__(self, *args, **kwargs) -> None:
                self.settings = get_settings()
            def get_or_create_customer(self, u: object) -> str:
                return "cus_mock_123"
            def capture_usage_charge(self, *args, **kwargs) -> object:
                return MockIntent()
                
        monkeypatch.setattr("remodelator.application.billing_adapters.StripeService", MockStripeService)
        
        result = execute_billing_command(
            session,
            user["user_id"],
            BillingCommand(event_type="simulate_estimate_charge", amount=Decimal("10.00")),
        )
        
        assert result["status"] == "charge_succeeded"
        assert result["payment_intent"] == "pi_mock_123"

        # Verify idempotency ledger entry
        ledger = service.list_billing_ledger(session, user["user_id"], limit=10)
        assert len(ledger) >= 1
        assert ledger[0]["event_type"] == "usage_charge"
        assert ledger[0]["amount"] == "10.00"
        assert "pi_mock_123" in ledger[0]["details"]
