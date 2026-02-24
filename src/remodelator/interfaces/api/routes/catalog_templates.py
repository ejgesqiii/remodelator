from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi import Query

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.constants import API_LIMIT_MAX, API_LIMIT_MIN
from remodelator.interfaces.api.constants import DEFAULT_CATALOG_SEARCH_LIMIT, DEFAULT_TEMPLATE_LIST_LIMIT
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import CatalogImportRequest
from remodelator.interfaces.api.schemas import CatalogUpsertRequest
from remodelator.interfaces.api.schemas import TemplateApplyRequest
from remodelator.interfaces.api.schemas import TemplateSaveRequest

router = APIRouter()


@router.get("/catalog/tree")
def catalog_tree() -> list[dict[str, Any]]:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.show_catalog_tree(session)

    return handle(action)


@router.get("/catalog/search")
def catalog_search(
    query: str,
    limit: int = Query(default=DEFAULT_CATALOG_SEARCH_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
) -> list[dict[str, Any]]:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.search_catalog_items(session, query, limit)

    return handle(action)


@router.post("/catalog/upsert")
def catalog_upsert(payload: CatalogUpsertRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.upsert_catalog_item(
                session=session,
                user_id=user_id,
                name=payload.name,
                unit_price=payload.unit_price,
                labor_hours=payload.labor_hours,
                description=payload.description,
                node_id=payload.node_id,
            )

    return handle(action)


@router.post("/catalog/import")
def catalog_import(payload: CatalogImportRequest, user_id: str = Depends(require_user_id)) -> dict[str, int]:
    def action() -> dict[str, int]:
        with session_scope() as session:
            return service.import_catalog_items(session, user_id, [row.model_dump() for row in payload.items])

    return handle(action)


@router.post("/templates/save")
def template_save(payload: TemplateSaveRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.save_template_from_estimate(session, user_id, payload.estimate_id, payload.name)

    return handle(action)


@router.get("/templates")
def template_list(
    limit: int = Query(default=DEFAULT_TEMPLATE_LIST_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    user_id: str = Depends(require_user_id),
) -> list[dict[str, Any]]:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.list_templates(session, user_id, limit)

    return handle(action)


@router.post("/templates/apply")
def template_apply(payload: TemplateApplyRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.apply_template_to_estimate(session, user_id, payload.template_id, payload.estimate_id)

    return handle(action)
