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

    class MockCustomer:
        invoice_settings = type("InvoiceSettings", (), {"default_payment_method": "pm_test_123"})()

    def mock_create(**kwargs):
        captured.update(kwargs)
        return MockIntent()

    monkeypatch.setattr(stripe.Customer, "retrieve", lambda *args, **kwargs: MockCustomer())
    monkeypatch.setattr(stripe.PaymentMethod, "list", lambda *args, **kwargs: type("PaymentMethods", (), {"data": []})())
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
    assert captured["payment_method"] == "pm_test_123"
    assert captured["off_session"] is True


def test_capture_usage_charge_falls_back_to_first_cors_origin_for_return_url(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.delenv("STRIPE_PAYMENT_RETURN_URL", raising=False)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "https://saas.example.com,http://localhost:5173")

    captured: dict[str, object] = {}

    class MockIntent:
        id = "pi_test_456"

    class MockCustomer:
        invoice_settings = type("InvoiceSettings", (), {"default_payment_method": "pm_test_456"})()

    def mock_create(**kwargs):
        captured.update(kwargs)
        return MockIntent()

    monkeypatch.setattr(stripe.Customer, "retrieve", lambda *args, **kwargs: MockCustomer())
    monkeypatch.setattr(stripe.PaymentMethod, "list", lambda *args, **kwargs: type("PaymentMethods", (), {"data": []})())
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


def test_capture_usage_charge_requires_saved_payment_method(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")

    class MockCustomer:
        invoice_settings = type("InvoiceSettings", (), {"default_payment_method": None})()

    monkeypatch.setattr(stripe.Customer, "retrieve", lambda *args, **kwargs: MockCustomer())
    monkeypatch.setattr(stripe.PaymentMethod, "list", lambda *args, **kwargs: type("PaymentMethods", (), {"data": []})())

    service = StripeService(get_settings())

    try:
        service.capture_usage_charge(
            customer_id="cus_missing_pm",
            amount=Decimal("10.00"),
            currency="USD",
            description="usage charge",
        )
    except ValueError as exc:
        assert "Complete Stripe Checkout first" in str(exc)
    else:
        raise AssertionError("Expected ValueError when no reusable payment method is saved.")


def test_create_checkout_session_saves_payment_method_for_future_usage(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    captured: dict[str, object] = {}

    class MockSession:
        url = "https://checkout.stripe.test/session"

    def mock_create(**kwargs):
        captured.update(kwargs)
        return MockSession()

    monkeypatch.setattr(stripe.checkout.Session, "create", mock_create)

    service = StripeService(get_settings())
    service.create_checkout_session(
        customer_id="cus_checkout_123",
        amount=Decimal("1200.00"),
        currency="USD",
        success_url="https://app.example.com/billing?checkout=success",
        cancel_url="https://app.example.com/billing?checkout=canceled",
    )

    assert captured["payment_intent_data"] == {"setup_future_usage": "off_session"}
