from __future__ import annotations

import hashlib

import pytest

from remodelator.application import auth_security


def test_hash_and_verify_password_roundtrip() -> None:
    hashed = auth_security.hash_password("pw123456")
    assert hashed.startswith("pbkdf2_sha256$")
    assert auth_security.verify_password(hashed, "pw123456") is True
    assert auth_security.verify_password(hashed, "pw-wrong") is False


def test_legacy_sha256_password_verification() -> None:
    legacy = hashlib.sha256("pw123456".encode("utf-8")).hexdigest()
    assert auth_security.is_legacy_sha256_hash(legacy) is True
    assert auth_security.verify_password(legacy, "pw123456") is True
    assert auth_security.verify_password(legacy, "wrong") is False


def test_normalize_password_enforces_bounds() -> None:
    assert auth_security.normalize_password("  pw123456  ") == "pw123456"
    with pytest.raises(ValueError, match="at least 8 characters"):
        auth_security.normalize_password("short")
    with pytest.raises(ValueError, match="128 characters or fewer"):
        auth_security.normalize_password("x" * 129)


def test_session_token_issue_and_resolve(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "local")
    monkeypatch.setenv("REMODELATOR_SESSION_SECRET", "test-session-secret")
    token = auth_security.issue_session_token("user-123")
    assert auth_security.resolve_user_id_from_session_token(token) == "user-123"


def test_production_mode_rejects_default_session_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "production")
    monkeypatch.delenv("REMODELATOR_SESSION_SECRET", raising=False)
    with pytest.raises(ValueError, match="REMODELATOR_SESSION_SECRET must be set in production"):
        auth_security.issue_session_token("user-123")


def test_role_for_email_reads_admin_allowlist(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ADMIN_USER_EMAILS", "owner@example.com")
    assert auth_security.role_for_email("owner@example.com") == "admin"
    assert auth_security.role_for_email("member@example.com") == "user"
