from __future__ import annotations

import base64
import hashlib
import json
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.infra.models import Estimate
from remodelator.infra.models import User


@pytest.fixture(autouse=True)
def _init_db_for_auth_security_tests() -> None:
    service.init_db()


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


def test_password_reset_flow_updates_password_and_invalidates_token() -> None:
    email = f"reset-{uuid4()}@example.com"
    old_password = "oldpw123"
    new_password = "newpw123"

    with session_scope() as session:
        service.register_user(session, email=email, password=old_password, full_name="Reset User")
        request_result = service.request_password_reset(session, email=email)
        reset_token = request_result["reset_token"]
        assert reset_token

    with session_scope() as session:
        auth = service.reset_password_with_token(session, token=reset_token or "", new_password=new_password)
        assert auth["email"] == email

    with session_scope() as session:
        login = service.login_user(session, email=email, password=new_password)
        assert login["email"] == email
        with pytest.raises(ValueError, match="invalid or expired"):
            service.reset_password_with_token(session, token=reset_token or "", new_password="another123")


def test_password_reset_request_does_not_fail_for_unknown_email() -> None:
    with session_scope() as session:
        payload = service.request_password_reset(session, email=f"unknown-{uuid4()}@example.com")
        assert payload["message"].startswith("If an account exists")


def _decode_session_payload(token: str) -> dict[str, object]:
    payload_b64 = token.split(".", 1)[0]
    padding = "=" * ((4 - len(payload_b64) % 4) % 4)
    return json.loads(base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8"))


def test_public_proposal_token_uses_configurable_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "local")
    monkeypatch.setenv("REMODELATOR_PUBLIC_PROPOSAL_TTL_SECONDS", "600")
    email = f"proposal-{uuid4()}@example.com"

    with session_scope() as session:
        auth = service.register_user(session, email=email, password="pw123456", full_name="Proposal User")
        estimate = service.create_estimate(session, auth["user_id"], title="Proposal TTL Estimate")
        share = service.create_public_proposal_token(session, auth["user_id"], estimate["id"])
        payload = _decode_session_payload(share["token"])
        assert payload["uid"] == f"proposal:{estimate['id']}:{auth['user_id']}"
        assert int(payload["exp"]) - int(payload["iat"]) == 600


def test_public_proposal_token_ttl_has_safe_minimum(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "local")
    monkeypatch.setenv("REMODELATOR_PUBLIC_PROPOSAL_TTL_SECONDS", "1")
    email = f"proposal-min-{uuid4()}@example.com"

    with session_scope() as session:
        auth = service.register_user(session, email=email, password="pw123456", full_name="Proposal Min User")
        estimate = service.create_estimate(session, auth["user_id"], title="Proposal Min TTL Estimate")
        share = service.create_public_proposal_token(session, auth["user_id"], estimate["id"])
        payload = _decode_session_payload(share["token"])
        assert int(payload["exp"]) - int(payload["iat"]) == 300
