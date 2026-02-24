from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import LoginRequest
from remodelator.interfaces.api.schemas import AuthResponse
from remodelator.interfaces.api.schemas import ProfileResponse
from remodelator.interfaces.api.schemas import ProfileUpdateRequest
from remodelator.interfaces.api.schemas import RegisterRequest

router = APIRouter()


@router.post("/auth/register", response_model=AuthResponse)
def auth_register(payload: RegisterRequest) -> AuthResponse:
    def action() -> dict[str, str]:
        with session_scope() as session:
            return service.register_user(session, payload.email, payload.password, payload.full_name)

    return handle(action)


@router.post("/auth/login", response_model=AuthResponse)
def auth_login(payload: LoginRequest) -> AuthResponse:
    def action() -> dict[str, str]:
        with session_scope() as session:
            return service.login_user(session, payload.email, payload.password)

    return handle(action)


@router.get("/profile", response_model=ProfileResponse)
def profile_show(user_id: str = Depends(require_user_id)) -> ProfileResponse:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.get_profile(session, user_id)

    return handle(action)


@router.put("/profile", response_model=ProfileResponse)
def profile_update(payload: ProfileUpdateRequest, user_id: str = Depends(require_user_id)) -> ProfileResponse:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.update_profile(
                session=session,
                user_id=user_id,
                full_name=payload.full_name,
                labor_rate=payload.labor_rate,
                item_markup_pct=payload.item_markup_pct,
                estimate_markup_pct=payload.estimate_markup_pct,
                tax_rate_pct=payload.tax_rate_pct,
            )

    return handle(action)
