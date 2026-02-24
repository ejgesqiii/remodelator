from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest

from remodelator.application import service
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.errors import CriticalDependencyError


def test_llm_live_returns_provider_response(monkeypatch: pytest.MonkeyPatch) -> None:
    expected = {
        "item_name": "Tile",
        "current_unit_price": "50.00",
        "suggested_unit_price": "57.00",
        "confidence": "0.82",
        "rationale": "Market-adjusted",
        "provider": "openrouter",
        "model": "google/gemini-2.5-flash",
        "mode": "live",
    }

    def _ok(**_: object) -> dict[str, str]:
        return expected

    monkeypatch.setattr(service, "suggest_price_openrouter", _ok)

    result = service.llm_live_price_suggestion("Tile", Decimal("50.00"), "demo")

    assert result == expected


def test_llm_live_raises_critical_on_provider_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise(**_: object) -> dict[str, str]:
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(service, "suggest_price_openrouter", _raise)

    with pytest.raises(CriticalDependencyError, match="OpenRouter LLM request failed"):
        service.llm_live_price_suggestion("Tile", Decimal("50.00"), "demo")


def test_llm_provider_status(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    status = service.llm_provider_status()

    assert status["provider"] == "openrouter"
    assert status["api_key_configured"] is False
    assert status["live_mode"] == "required"
    assert status["max_price_change_pct"] == "20"
    assert status["simulation_available"] is False
    assert status["blocker_reason"]


def test_apply_llm_suggestion_uses_default_twenty_percent_bound() -> None:
    email = f"llm-default-bound-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="LLM Default Bound")
        estimate = service.create_estimate(session, user["user_id"], "LLM Bound")
        line_item = service.add_line_item(
            session=session,
            user_id=user["user_id"],
            estimate_id=estimate["id"],
            item_name="Tile",
            quantity=Decimal("1"),
            unit_price=Decimal("100"),
            item_markup_pct=None,
            labor_hours=Decimal("0"),
            discount_value=Decimal("0"),
            discount_is_percent=False,
            group_name="General",
        )
        updated = service.apply_llm_suggestion_to_line_item(
            session=session,
            user_id=user["user_id"],
            estimate_id=estimate["id"],
            line_item_id=line_item["id"],
            suggested_price=Decimal("500"),
        )

    assert Decimal(str(updated["unit_price"])) == Decimal("120")


def test_apply_llm_suggestion_honors_configured_max_change(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REMODELATOR_LLM_PRICE_CHANGE_MAX_PCT", "50")

    email = f"llm-config-bound-{uuid4()}@example.com"
    with session_scope() as session:
        user = service.register_user(session, email=email, password="pw123456", full_name="LLM Config Bound")
        estimate = service.create_estimate(session, user["user_id"], "LLM Bound Config")
        line_item = service.add_line_item(
            session=session,
            user_id=user["user_id"],
            estimate_id=estimate["id"],
            item_name="Tile",
            quantity=Decimal("1"),
            unit_price=Decimal("100"),
            item_markup_pct=None,
            labor_hours=Decimal("0"),
            discount_value=Decimal("0"),
            discount_is_percent=False,
            group_name="General",
        )
        updated = service.apply_llm_suggestion_to_line_item(
            session=session,
            user_id=user["user_id"],
            estimate_id=estimate["id"],
            line_item_id=line_item["id"],
            suggested_price=Decimal("500"),
        )

    assert Decimal(str(updated["unit_price"])) == Decimal("150")
