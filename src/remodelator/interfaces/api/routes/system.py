from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.router_utils import handle, reject_in_production
from remodelator.interfaces.api.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    def action() -> dict[str, str]:
        with session_scope() as session:
            session.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}

    return handle(action)


@router.post("/db/migrate")
def db_migrate() -> dict[str, str]:
    reject_in_production("db.migrate")
    return handle(lambda: service.init_db())


@router.post("/db/seed")
def db_seed() -> dict[str, int]:
    reject_in_production("db.seed")

    def action() -> dict[str, int]:
        with session_scope() as session:
            return service.seed_catalog(session)

    return handle(action)
