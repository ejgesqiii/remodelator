from __future__ import annotations

from decimal import Decimal

from remodelator.config import Settings
from remodelator.domain.pricing import d


def llm_provider_status_payload(settings: Settings) -> dict[str, object]:
    ready_for_live = bool(settings.openrouter_api_key)
    blocker_reason = None if ready_for_live else "OPENROUTER_API_KEY is not set. Live LLM calls are blocked."
    return {
        "provider": "openrouter",
        "model": settings.openrouter_model,
        "api_key_configured": ready_for_live,
        "live_mode": "required",
        "timeout_seconds": settings.openrouter_timeout_seconds,
        "max_retries": settings.openrouter_max_retries,
        "max_price_change_pct": str(settings.llm_price_change_max_pct),
        "simulation_available": False,
        "ready_for_live": ready_for_live,
        "blocker_reason": blocker_reason,
    }


def clamp_suggested_unit_price(current_price: Decimal, suggested_price: Decimal, max_change_pct: Decimal) -> Decimal:
    max_delta_pct = max(Decimal("0"), d(max_change_pct))
    delta_factor = max_delta_pct / Decimal("100")
    current = d(current_price)
    minimum = current * (Decimal("1") - delta_factor)
    maximum = current * (Decimal("1") + delta_factor)
    return min(max(d(suggested_price), minimum), maximum)
