from __future__ import annotations

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
