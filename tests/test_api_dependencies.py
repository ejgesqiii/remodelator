from __future__ import annotations

from contextlib import contextmanager

import pytest
from fastapi import HTTPException

from remodelator.interfaces.api import dependencies


def test_require_user_id_accepts_valid_session_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(dependencies.service, "resolve_user_id_from_session_token", lambda token: f"user:{token}")
    user_id = dependencies.require_user_id(x_session_token="token-123")
    assert user_id == "user:token-123"


def test_require_user_id_rejects_invalid_session_token(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise(_: str) -> str:
        raise ValueError("Invalid session token.")

    monkeypatch.setattr(dependencies.service, "resolve_user_id_from_session_token", _raise)
    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_user_id(x_session_token="bad-token")

    assert exc_info.value.status_code == 401
    assert "Invalid session token" in str(exc_info.value.detail)


def test_require_user_id_rejects_legacy_header_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("REMODELATOR_ALLOW_LEGACY_USER_HEADER", raising=False)
    monkeypatch.setenv("REMODELATOR_ENV", "local")
    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_user_id(x_user_id="legacy-user", x_session_token=None)

    assert exc_info.value.status_code == 401
    assert "x-user-id header is disabled" in str(exc_info.value.detail)


def test_require_user_id_allows_legacy_header_when_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_ALLOW_LEGACY_USER_HEADER", "true")
    user_id = dependencies.require_user_id(x_user_id="legacy-user", x_session_token=None)
    assert user_id == "legacy-user"


def test_require_admin_key_requires_header() -> None:
    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_admin_key(None)

    assert exc_info.value.status_code == 401
    assert "Missing x-admin-key header" in str(exc_info.value.detail)


def test_require_verified_admin_key_rejects_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise(_: str) -> None:
        raise ValueError("invalid admin key")

    monkeypatch.setattr(dependencies.service, "verify_admin_key", _raise)
    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_verified_admin_key("wrong-key")

    assert exc_info.value.status_code == 401
    assert "invalid admin key" in str(exc_info.value.detail)


def test_require_admin_read_access_accepts_admin_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(dependencies.service, "verify_admin_key", lambda _: None)
    actor = dependencies.require_admin_read_access(x_admin_key="local-admin-key")
    assert actor == "admin-key"


def test_require_admin_read_access_accepts_admin_session(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(dependencies.service, "resolve_user_id_from_session_token", lambda _: "user-admin")

    @contextmanager
    def _fake_session_scope():
        yield object()

    monkeypatch.setattr(dependencies, "session_scope", _fake_session_scope)
    monkeypatch.setattr(dependencies.service, "require_admin_user_access", lambda _session, _user_id: None)

    actor = dependencies.require_admin_read_access(x_session_token="good-token")
    assert actor == "user-admin"


def test_require_admin_read_access_rejects_non_admin_session(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(dependencies.service, "resolve_user_id_from_session_token", lambda _: "user-basic")

    @contextmanager
    def _fake_session_scope():
        yield object()

    monkeypatch.setattr(dependencies, "session_scope", _fake_session_scope)

    def _reject(_session: object, _user_id: str) -> None:
        raise ValueError("admin only")

    monkeypatch.setattr(dependencies.service, "require_admin_user_access", _reject)

    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_admin_read_access(x_session_token="basic-token")

    assert exc_info.value.status_code == 403
    assert "admin only" in str(exc_info.value.detail)


def test_require_admin_read_access_requires_header() -> None:
    with pytest.raises(HTTPException) as exc_info:
        dependencies.require_admin_read_access()

    assert exc_info.value.status_code == 401
    assert "Missing admin auth header" in str(exc_info.value.detail)
