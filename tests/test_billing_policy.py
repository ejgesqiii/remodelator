from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from remodelator.application.billing_policy import (
    billing_policy_payload,
    billing_provider_status_payload,
    normalize_gateway_event_type,
    resolve_gateway_event_amount,
    validate_gateway_lifecycle_transition,
)
from remodelator.config import Settings


def _settings(*, provider: str = "simulation", stripe_key: str | None = None, stripe_webhook: str | None = None) -> Settings:
    return Settings(
        app_env="local",
        data_dir=Path("."),
        db_url="sqlite:///./data/remodelator.db",
        session_file=Path("./data/session.json"),
        session_secret="secret",
        session_ttl_seconds=3600,
        allow_legacy_user_header=False,
        sqlite_journal_mode="WAL",
        sqlite_synchronous="NORMAL",
        sqlite_busy_timeout_ms=5000,
        operation_lock_timeout_seconds=10.0,
        openrouter_api_key=None,
        openrouter_model="google/gemini-2.5-flash",
        openrouter_timeout_seconds=30.0,
        openrouter_max_retries=2,
        openrouter_retry_backoff_seconds=0.6,
        llm_price_change_max_pct=Decimal("20"),
        billing_annual_subscription_amount=Decimal("1200.00"),
        billing_realtime_pricing_amount=Decimal("10.00"),
        billing_currency="USD",
        billing_provider=provider,
        stripe_secret_key=stripe_key,
        stripe_webhook_secret=stripe_webhook,
        api_limit_max=500,
        api_rate_limit_enabled=True,
        api_rate_limit_window_seconds=60,
        api_rate_limit_public_max=120,
        api_rate_limit_authenticated_max=240,
        audit_retention_days=365,
        admin_api_key="local-admin-key",
        admin_user_emails=(),
        cors_allowed_origins=(),
    )


def test_billing_policy_payload_uses_string_amounts() -> None:
    payload = billing_policy_payload(_settings())
    assert payload == {
        "mode": "hybrid",
        "annual_subscription_amount": "1200.00",
        "realtime_pricing_amount": "10.00",
        "currency": "USD",
    }


def test_billing_provider_status_payload_blocks_stripe_without_secret_key() -> None:
    status = billing_provider_status_payload(_settings(provider="stripe", stripe_key=None))
    assert status["provider"] == "stripe"
    assert status["adapter_ready"] is False
    assert status["ready_for_live"] is False
    assert status["blocker_reason"] == "STRIPE_SECRET_KEY is not configured."


def test_billing_provider_status_payload_ready_for_stripe_with_secret_key() -> None:
    status = billing_provider_status_payload(_settings(provider="stripe", stripe_key="sk_test_123", stripe_webhook="whsec_456"))
    assert status["provider"] == "stripe"
    assert status["adapter_ready"] is False
    assert status["ready_for_live"] is False
    assert status["stripe_key_configured"] is True
    assert status["stripe_webhook_secret_configured"] is True
    assert status["blocker_reason"] == "Stripe live adapter is not enabled in this demo build."


def test_billing_provider_status_payload_blocks_stripe_without_webhook_secret() -> None:
    status = billing_provider_status_payload(_settings(provider="stripe", stripe_key="sk_test_123", stripe_webhook=None))
    assert status["provider"] == "stripe"
    assert status["adapter_ready"] is False
    assert status["ready_for_live"] is False
    assert status["stripe_key_configured"] is True
    assert status["stripe_webhook_secret_configured"] is False
    assert status["blocker_reason"] == "STRIPE_WEBHOOK_SECRET is not configured."


def test_normalize_gateway_event_type_rejects_unknown_values() -> None:
    with pytest.raises(ValueError):
        normalize_gateway_event_type("unexpected_event")


def test_resolve_gateway_event_amount_defaults_match_hybrid_policy() -> None:
    settings = _settings()
    assert resolve_gateway_event_amount(settings, "checkout_completed", None) == Decimal("1200.00")
    assert resolve_gateway_event_amount(settings, "usage_charge", None) == Decimal("10.00")
    assert resolve_gateway_event_amount(settings, "invoice_paid", None) == Decimal("0.00")


def test_validate_gateway_lifecycle_transition_rejects_invalid_start_state() -> None:
    with pytest.raises(ValueError):
        validate_gateway_lifecycle_transition("usage_charge", None)


def test_validate_gateway_lifecycle_transition_allows_checkout_after_payment_method_attach() -> None:
    validate_gateway_lifecycle_transition("checkout_completed", "payment_method_attached")
