from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import GroupRequest
from remodelator.interfaces.api.schemas import LineItemCreateRequest
from remodelator.interfaces.api.schemas import LineItemUpdateRequest
from remodelator.interfaces.api.schemas import ReorderRequest

router = APIRouter()


@router.post("/estimates/{estimate_id}/line-items")
def line_item_add(
    estimate_id: str,
    payload: LineItemCreateRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.add_line_item(
                session=session,
                user_id=user_id,
                estimate_id=estimate_id,
                item_name=payload.item_name,
                quantity=payload.quantity,
                unit_price=payload.unit_price,
                item_markup_pct=payload.item_markup_pct,
                labor_hours=payload.labor_hours,
                discount_value=payload.discount_value,
                discount_is_percent=payload.discount_is_percent,
                group_name=payload.group_name,
            )

    return handle(action)


@router.put("/estimates/{estimate_id}/line-items/{line_item_id}")
def line_item_edit(
    estimate_id: str,
    line_item_id: str,
    payload: LineItemUpdateRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.edit_line_item(
                session=session,
                user_id=user_id,
                estimate_id=estimate_id,
                line_item_id=line_item_id,
                quantity=payload.quantity,
                unit_price=payload.unit_price,
                item_markup_pct=payload.item_markup_pct,
                labor_hours=payload.labor_hours,
                discount_value=payload.discount_value,
                discount_is_percent=payload.discount_is_percent,
                group_name=payload.group_name,
            )

    return handle(action)


@router.delete("/estimates/{estimate_id}/line-items/{line_item_id}")
def line_item_remove(
    estimate_id: str,
    line_item_id: str,
    user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    def action() -> dict[str, str]:
        with session_scope() as session:
            return service.remove_line_item(session, user_id, estimate_id, line_item_id)

    return handle(action)


@router.post("/estimates/{estimate_id}/line-items/{line_item_id}/reorder")
def line_item_reorder(
    estimate_id: str,
    line_item_id: str,
    payload: ReorderRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.reorder_line_item(session, user_id, estimate_id, line_item_id, payload.new_index)

    return handle(action)


@router.post("/estimates/{estimate_id}/line-items/group")
def line_item_group(
    estimate_id: str,
    payload: GroupRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.group_line_item(
                session,
                user_id,
                estimate_id,
                payload.group_name,
                payload.line_item_id,
            )

    return handle(action)
