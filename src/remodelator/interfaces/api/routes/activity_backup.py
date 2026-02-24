from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi import Query

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.constants import API_LIMIT_MAX, API_LIMIT_MIN, DEFAULT_AUDIT_LIMIT
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import BackupRestoreRequest

router = APIRouter()


@router.get("/audit")
def audit_list(
    limit: int = Query(default=DEFAULT_AUDIT_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    user_id: str = Depends(require_user_id),
) -> list[dict[str, str]]:
    def action() -> list[dict[str, str]]:
        with session_scope() as session:
            return service.list_audit_events(session, user_id, limit)

    return handle(action)


@router.get("/activity")
def activity_report(user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.activity_report(session, user_id)

    return handle(action)


@router.get("/backup/export")
def backup_export(user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.export_user_backup(session, user_id)

    return handle(action)


@router.post("/backup/restore")
def backup_restore(payload: BackupRestoreRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.restore_user_backup(session, user_id, payload.payload)

    return handle(action)
