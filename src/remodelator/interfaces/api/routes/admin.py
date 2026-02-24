from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi import Query

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.constants import API_LIMIT_MAX, API_LIMIT_MIN, DEFAULT_ADMIN_LIMIT
from remodelator.interfaces.api.dependencies import require_admin_read_access
from remodelator.interfaces.api.dependencies import require_admin_key
from remodelator.interfaces.api.router_utils import handle, reject_in_production
from remodelator.interfaces.api.schemas import AdminActivityResponse
from remodelator.interfaces.api.schemas import AdminAuditPruneResponse
from remodelator.interfaces.api.schemas import AdminBillingLedgerResponse
from remodelator.interfaces.api.schemas import AdminDemoResetResponse
from remodelator.interfaces.api.schemas import AdminSummaryResponse
from remodelator.interfaces.api.schemas import AdminUserResponse

router = APIRouter()


@router.get("/admin/summary", response_model=AdminSummaryResponse)
def admin_summary(_admin_auth: str = Depends(require_admin_read_access)) -> AdminSummaryResponse:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.admin_summary(session)

    return handle(action)


@router.get("/admin/users", response_model=list[AdminUserResponse])
def admin_users(
    limit: int = Query(default=DEFAULT_ADMIN_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    search: str | None = Query(default=None, max_length=255),
    _admin_auth: str = Depends(require_admin_read_access),
) -> list[AdminUserResponse]:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.admin_users(session, limit, search)

    return handle(action)


@router.get("/admin/activity", response_model=list[AdminActivityResponse])
def admin_activity(
    limit: int = Query(default=DEFAULT_ADMIN_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    user_id: str | None = Query(default=None, max_length=64),
    action_name: str | None = Query(default=None, max_length=128, alias="action"),
    entity_type: str | None = Query(default=None, max_length=64),
    _admin_auth: str = Depends(require_admin_read_access),
) -> list[AdminActivityResponse]:
    def action() -> list[dict[str, str]]:
        with session_scope() as session:
            return service.admin_activity(session, limit, user_id, action_name, entity_type)

    return handle(action)


@router.get("/admin/billing-ledger", response_model=list[AdminBillingLedgerResponse])
def admin_billing_ledger(
    limit: int = Query(default=DEFAULT_ADMIN_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    user_id: str | None = Query(default=None, max_length=64),
    event_type: str | None = Query(default=None, max_length=64),
    _admin_auth: str = Depends(require_admin_read_access),
) -> list[AdminBillingLedgerResponse]:
    def action() -> list[dict[str, str]]:
        with session_scope() as session:
            return service.list_billing_ledger_admin(session, limit, user_id, event_type)

    return handle(action)


@router.post("/admin/demo-reset", response_model=AdminDemoResetResponse)
def admin_demo_reset(admin_key: str = Depends(require_admin_key)) -> AdminDemoResetResponse:
    reject_in_production("admin.demo-reset")

    def action() -> dict[str, Any]:
        service.verify_admin_key(admin_key)
        return service.rebuild_demo_database()

    return handle(action)


@router.post("/admin/audit-prune", response_model=AdminAuditPruneResponse)
def admin_audit_prune(
    retention_days: int | None = Query(default=None, ge=1),
    dry_run: bool = Query(default=False),
    admin_key: str = Depends(require_admin_key),
) -> AdminAuditPruneResponse:
    def action() -> dict[str, Any]:
        service.verify_admin_key(admin_key)
        with session_scope() as session:
            return service.prune_audit_events(session, retention_days=retention_days, dry_run=dry_run)

    return handle(action)
