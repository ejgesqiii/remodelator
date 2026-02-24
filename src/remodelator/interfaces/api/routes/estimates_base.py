from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import EstimateCreateRequest
from remodelator.interfaces.api.schemas import EstimateQuickstartRequest
from remodelator.interfaces.api.schemas import EstimateUpdateRequest
from remodelator.interfaces.api.schemas import ExportRequest
from remodelator.interfaces.api.schemas import StatusRequest

router = APIRouter()


@router.post("/estimates")
def estimate_create(payload: EstimateCreateRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.create_estimate(
                session=session,
                user_id=user_id,
                title=payload.title,
                customer_name=payload.customer_name,
                customer_email=payload.customer_email,
                customer_phone=payload.customer_phone,
                job_address=payload.job_address,
            )

    return handle(action)


@router.get("/estimates")
def estimate_list(user_id: str = Depends(require_user_id)) -> list[dict[str, Any]]:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.list_estimates(session, user_id)

    return handle(action)


@router.get("/estimates/{estimate_id}")
def estimate_show(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.get_estimate(session, user_id, estimate_id)

    return handle(action)


@router.put("/estimates/{estimate_id}")
def estimate_update(
    estimate_id: str,
    payload: EstimateUpdateRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.update_estimate(
                session=session,
                user_id=user_id,
                estimate_id=estimate_id,
                title=payload.title,
                customer_name=payload.customer_name,
                customer_email=payload.customer_email,
                customer_phone=payload.customer_phone,
                job_address=payload.job_address,
                estimate_markup_pct=payload.estimate_markup_pct,
                tax_rate_pct=payload.tax_rate_pct,
            )

    return handle(action)


@router.post("/estimates/{estimate_id}/status")
def estimate_status(
    estimate_id: str,
    payload: StatusRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.change_estimate_status(session, user_id, estimate_id, payload.status)

    return handle(action)


@router.post("/estimates/{estimate_id}/unlock")
def estimate_unlock(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.unlock_estimate(session, user_id, estimate_id)

    return handle(action)


@router.post("/estimates/{estimate_id}/duplicate")
def estimate_duplicate(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.duplicate_estimate(session, user_id, estimate_id)

    return handle(action)


@router.post("/estimates/{estimate_id}/version")
def estimate_version(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.create_estimate_version(session, user_id, estimate_id)

    return handle(action)


@router.post("/estimates/{estimate_id}/recalc")
def estimate_recalc(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.recalc_estimate(session, user_id, estimate_id)

    return handle(action)


@router.post("/estimates/{estimate_id}/quickstart")
def estimate_quickstart(
    estimate_id: str,
    payload: EstimateQuickstartRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.quickstart_estimate_from_catalog(
                session=session,
                user_id=user_id,
                estimate_id=estimate_id,
                catalog_node_name=payload.catalog_node_name,
                max_items=payload.max_items,
            )

    return handle(action)


@router.post("/estimates/{estimate_id}/export")
def estimate_export(
    estimate_id: str,
    payload: ExportRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    def action() -> dict[str, str]:
        with session_scope() as session:
            return service.export_estimate_json(session, user_id, estimate_id, Path(payload.output_path))

    return handle(action)
