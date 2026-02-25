from __future__ import annotations

import hashlib
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.infra.models import Estimate
from remodelator.infra.models import User


def test_register_uses_strong_password_hash() -> None:
    email = f"secure-{uuid4()}@example.com"
    with session_scope() as session:
        payload = service.register_user(session, email=email, password="pw123456", full_name="Security User")
        user = session.get(User, payload["user_id"])
        assert user is not None
        assert user.password_hash.startswith("pbkdf2_sha256$")
        assert len(user.password_hash) > 80


def test_login_upgrades_legacy_sha256_hash() -> None:
    email = f"legacy-{uuid4()}@example.com"
    password = "pw123456"
    legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    user_id = str(uuid4())

    with session_scope() as session:
        session.add(
            User(
                id=user_id,
                email=email,
                password_hash=legacy_hash,
                full_name="Legacy User",
                labor_rate=Decimal("75.00"),
                default_item_markup_pct=Decimal("10.00"),
                default_estimate_markup_pct=Decimal("5.00"),
                tax_rate_pct=Decimal("8.25"),
                stripe_customer_id=None,
                stripe_subscription_id=None,
            )
        )

    with session_scope() as session:
        result = service.login_user(session, email=email, password=password)
        assert result["user_id"] == user_id
        upgraded_user = session.get(User, user_id)
        assert upgraded_user is not None
        assert upgraded_user.password_hash.startswith("pbkdf2_sha256$")
        assert upgraded_user.password_hash != legacy_hash


def test_production_mode_rejects_default_admin_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "production")
    monkeypatch.setenv("REMODELATOR_ADMIN_API_KEY", "local-admin-key")
    with pytest.raises(ValueError, match="must be set in production"):
        service.verify_admin_key("local-admin-key")


def test_allow_legacy_user_header_defaults_to_false(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("REMODELATOR_ALLOW_LEGACY_USER_HEADER", raising=False)
    monkeypatch.setenv("REMODELATOR_ENV", "local")
    from remodelator.config import get_settings

    settings = get_settings()
    assert settings.allow_legacy_user_header is False


def test_foreign_key_enforced_for_estimate_user() -> None:
    service.init_db()
    with pytest.raises(IntegrityError):
        with session_scope() as session:
            session.add(Estimate(id=str(uuid4()), user_id=str(uuid4()), title="Orphan Estimate"))
            session.flush()
