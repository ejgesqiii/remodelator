from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import LlmApplyRequest
from remodelator.interfaces.api.schemas import LlmStatusResponse
from remodelator.interfaces.api.schemas import LlmSuggestRequest
from remodelator.interfaces.api.schemas import LlmSuggestionResponse

router = APIRouter()


def _llm_suggest(payload: LlmSuggestRequest) -> dict[str, str]:
    return handle(lambda: service.llm_live_price_suggestion(payload.item_name, payload.current_unit_price, payload.context))


@router.post("/pricing/llm/simulate", response_model=LlmSuggestionResponse, deprecated=True)
def pricing_llm_simulate(
    payload: LlmSuggestRequest,
    _user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    # Backward-compatible alias kept for older clients; all LLM calls are OpenRouter live only.
    return _llm_suggest(payload)


@router.get("/pricing/llm/status", response_model=LlmStatusResponse)
def pricing_llm_status() -> dict[str, object]:
    return handle(service.llm_provider_status)


@router.post("/pricing/llm/live", response_model=LlmSuggestionResponse)
def pricing_llm_live(
    payload: LlmSuggestRequest,
    _user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    return _llm_suggest(payload)


@router.post("/pricing/llm/apply")
def pricing_llm_apply(payload: LlmApplyRequest, user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.apply_llm_suggestion_to_line_item(
                session,
                user_id,
                payload.estimate_id,
                payload.line_item_id,
                payload.suggested_price,
            )

    return handle(action)
