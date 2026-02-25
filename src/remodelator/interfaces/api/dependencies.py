from __future__ import annotations

from fastapi import Header, HTTPException

from remodelator.application import service
from remodelator.config import get_settings
from remodelator.infra.db import session_scope


def _resolve_user_id(x_user_id: str | None, x_session_token: str | None) -> str:
    if x_session_token:
        try:
            return service.resolve_user_id_from_session_token(x_session_token)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    settings = get_settings()
    if x_user_id and settings.allow_legacy_user_header:
        return x_user_id
    if x_user_id and not settings.allow_legacy_user_header:
        raise HTTPException(status_code=401, detail="x-user-id header is disabled; use x-session-token.")
    raise HTTPException(status_code=401, detail="Missing x-session-token header")


def _resolve_admin_key(header_value: str | None) -> str:
    if not header_value:
        raise HTTPException(status_code=401, detail="Missing x-admin-key header")
    return header_value


def require_user_id(
    x_user_id: str | None = Header(default=None),
    x_session_token: str | None = Header(default=None),
) -> str:
    return _resolve_user_id(x_user_id, x_session_token)


def require_admin_key(x_admin_key: str | None = Header(default=None)) -> str:
    return _resolve_admin_key(x_admin_key)


def require_verified_admin_key(x_admin_key: str | None = Header(default=None)) -> str:
    admin_key = _resolve_admin_key(x_admin_key)
    try:
        service.verify_admin_key(admin_key)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return admin_key


def require_admin_read_access(
    x_admin_key: str | None = Header(default=None),
    x_session_token: str | None = Header(default=None),
) -> str:
    admin_key = x_admin_key if isinstance(x_admin_key, str) else None
    session_token = x_session_token if isinstance(x_session_token, str) else None

    if admin_key:
        try:
            service.verify_admin_key(admin_key)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc
        return "admin-key"

    if not session_token:
        raise HTTPException(status_code=401, detail="Missing admin auth header: provide x-admin-key or x-session-token")

    try:
        user_id = service.resolve_user_id_from_session_token(session_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    try:
        with session_scope() as session:
            service.require_admin_user_access(session, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return user_id


def require_admin_user_id(x_session_token: str | None = Header(default=None)) -> str:
    if not x_session_token:
        raise HTTPException(status_code=401, detail="Missing x-session-token header")

    try:
        user_id = service.resolve_user_id_from_session_token(x_session_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    try:
        with session_scope() as session:
            service.require_admin_user_access(session, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return user_id
