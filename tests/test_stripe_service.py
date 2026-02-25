from __future__ import annotations

from decimal import Decimal

import stripe

from remodelator.application.stripe_service import StripeService
from remodelator.config import get_settings


def test_stripe_service_uses_configured_api_version(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_API_VERSION", "2025-09-30.clover")

    StripeService(get_settings())
    assert stripe.api_version == "2025-09-30.clover"


def test_stripe_service_webhook_mode_does_not_require_secret_key(monkeypatch) -> None:
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")

    service = StripeService(get_settings(), require_secret_key=False)
    assert service.settings.stripe_webhook_secret == "whsec_123"


def test_capture_usage_charge_uses_configured_return_url(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_PAYMENT_RETURN_URL", "https://app.example.com/billing/return")

    captured: dict[str, object] = {}

    class MockIntent:
        id = "pi_test_123"

    def mock_create(**kwargs):
        captured.update(kwargs)
        return MockIntent()

    monkeypatch.setattr(stripe.PaymentIntent, "create", mock_create)

    service = StripeService(get_settings())
    intent = service.capture_usage_charge(
        customer_id="cus_test_123",
        amount=Decimal("10.00"),
        currency="USD",
        description="usage charge",
    )

    assert intent.id == "pi_test_123"
    assert captured["return_url"] == "https://app.example.com/billing/return"
    assert captured["automatic_payment_methods"] == {"enabled": True, "allow_redirects": "never"}


def test_capture_usage_charge_falls_back_to_first_cors_origin_for_return_url(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.delenv("STRIPE_PAYMENT_RETURN_URL", raising=False)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "https://saas.example.com,http://localhost:5173")

    captured: dict[str, object] = {}

    class MockIntent:
        id = "pi_test_456"

    def mock_create(**kwargs):
        captured.update(kwargs)
        return MockIntent()

    monkeypatch.setattr(stripe.PaymentIntent, "create", mock_create)

    service = StripeService(get_settings())
    intent = service.capture_usage_charge(
        customer_id="cus_test_456",
        amount=Decimal("12.34"),
        currency="USD",
        description="usage charge",
    )

    assert intent.id == "pi_test_456"
    assert captured["return_url"] == "https://saas.example.com/billing?stripe_return=1"
