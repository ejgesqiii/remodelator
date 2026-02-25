from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import ExportRequest

router = APIRouter()


@router.get("/proposals/{estimate_id}/render")
def proposal_render(estimate_id: str, user_id: str = Depends(require_user_id)) -> dict[str, str]:
    def action() -> dict[str, str]:
        with session_scope() as session:
            rendered = service.render_proposal_text(session, user_id, estimate_id)
            return {"rendered": rendered}

    return handle(action)


@router.post("/proposals/{estimate_id}/pdf")
def proposal_pdf(
    estimate_id: str,
    payload: ExportRequest | None = None,
    user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    def action() -> dict[str, str]:
        with session_scope() as session:
            output_path = Path(payload.output_path) if payload and payload.output_path else None
            return service.generate_proposal_pdf(session, user_id, estimate_id, output_path)

    return handle(action)
