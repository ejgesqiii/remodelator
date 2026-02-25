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
from remodelator.infra.models import BillingEvent, IdempotencyRecord
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


def test_record_billing_event_idempotency_key_is_user_scoped() -> None:
    service.init_db()

    email_one = f"idempo-user-one-{uuid4()}@example.com"
    email_two = f"idempo-user-two-{uuid4()}@example.com"
    with session_scope() as session:
        user_one = service.register_user(session, email=email_one, password="pw123456", full_name="User One")
        user_two = service.register_user(session, email=email_two, password="pw123456", full_name="User Two")

        first = service.record_billing_event(
            session,
            user_one["user_id"],
            "estimate_charge",
            Decimal("10.00"),
            idempotency_key="shared-key",
        )
        second = service.record_billing_event(
            session,
            user_two["user_id"],
            "estimate_charge",
            Decimal("12.00"),
            idempotency_key="shared-key",
        )
        replay = service.record_billing_event(
            session,
            user_one["user_id"],
            "estimate_charge",
            Decimal("99.00"),
            idempotency_key="shared-key",
        )

        assert first["idempotency_status"] == "created"
        assert second["idempotency_status"] == "created"
        assert replay["idempotency_status"] == "replayed"
        assert replay["billing_event_id"] == first["billing_event_id"]

        ledger_one = service.list_billing_ledger(session, user_one["user_id"], limit=10)
        ledger_two = service.list_billing_ledger(session, user_two["user_id"], limit=10)
        assert len(ledger_one) == 1
        assert len(ledger_two) == 1


def test_record_billing_event_handles_long_idempotency_key() -> None:
    service.init_db()

    email = f"idempo-long-{uuid4()}@example.com"
    long_key = "k" * 512
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Long Key User")
        first = service.record_billing_event(
            session,
            user["user_id"],
            "estimate_charge",
            Decimal("10.00"),
            idempotency_key=long_key,
        )
        replay = service.record_billing_event(
            session,
            user["user_id"],
            "estimate_charge",
            Decimal("99.00"),
            idempotency_key=long_key,
        )

        assert first["idempotency_status"] == "created"
        assert replay["idempotency_status"] == "replayed"
        assert replay["billing_event_id"] == first["billing_event_id"]

        records = (
            session.query(IdempotencyRecord)
            .filter_by(scope="billing", user_id=user["user_id"])
            .order_by(IdempotencyRecord.created_at.desc())
            .all()
        )
        assert len(records) == 1
        assert records[0].key.startswith(f"billing:{user['user_id']}:")
        assert len(records[0].key) <= 128


def test_record_billing_event_replays_legacy_raw_idempotency_key_record() -> None:
    service.init_db()

    email = f"idempo-legacy-{uuid4()}@example.com"
    legacy_key = "legacy-shared-key"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="Legacy Key User")
        legacy_event = BillingEvent(
            id=str(uuid4()),
            user_id=user["user_id"],
            event_type="estimate_charge",
            amount=Decimal("10.00"),
            currency="USD",
            details="legacy seeded",
        )
        session.add(legacy_event)
        session.flush()
        session.add(
            IdempotencyRecord(
                id=str(uuid4()),
                key=legacy_key,
                scope="billing",
                user_id=user["user_id"],
                billing_event_id=legacy_event.id,
            )
        )
        session.flush()

        replay = service.record_billing_event(
            session,
            user["user_id"],
            "estimate_charge",
            Decimal("99.00"),
            idempotency_key=legacy_key,
        )
        assert replay["idempotency_status"] == "replayed"
        assert replay["billing_event_id"] == legacy_event.id
