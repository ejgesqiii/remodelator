from __future__ import annotations

from decimal import Decimal
from pathlib import Path

from remodelator.application.llm_policy import clamp_suggested_unit_price
from remodelator.application.llm_policy import llm_provider_status_payload
from remodelator.config import Settings


def _settings(api_key: str | None = None) -> Settings:
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
        openrouter_api_key=api_key,
        openrouter_model="google/gemini-2.5-flash",
        openrouter_timeout_seconds=30.0,
        openrouter_max_retries=2,
        openrouter_retry_backoff_seconds=0.6,
        llm_price_change_max_pct=Decimal("20"),
        billing_annual_subscription_amount=Decimal("1200.00"),
        billing_realtime_pricing_amount=Decimal("10.00"),
        billing_currency="USD",
        billing_provider="simulation",
        stripe_secret_key=None,
        stripe_webhook_secret=None,
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


def test_llm_provider_status_payload_blocked_when_no_key() -> None:
    status = llm_provider_status_payload(_settings(api_key=None))
    assert status["ready_for_live"] is False
    assert status["api_key_configured"] is False
    assert status["blocker_reason"]


def test_llm_provider_status_payload_ready_when_key_present() -> None:
    status = llm_provider_status_payload(_settings(api_key="sk-live"))
    assert status["ready_for_live"] is True
    assert status["api_key_configured"] is True
    assert status["blocker_reason"] is None
    assert status["max_price_change_pct"] == "20"


def test_clamp_suggested_unit_price_uses_max_change_pct() -> None:
    current = Decimal("100")
    assert clamp_suggested_unit_price(current, Decimal("500"), Decimal("20")) == Decimal("120")
    assert clamp_suggested_unit_price(current, Decimal("10"), Decimal("20")) == Decimal("80")
    assert clamp_suggested_unit_price(current, Decimal("130"), Decimal("50")) == Decimal("130")
