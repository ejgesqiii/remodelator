from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path

import pytest

from remodelator.domain.pricing import PricingInput, calculate_line_total

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PATH = ROOT / "tests" / "fixtures" / "pricing_canonical_fixtures.json"


def _load_fixtures() -> list[dict[str, object]]:
    return json.loads(FIXTURE_PATH.read_text())


@pytest.mark.parametrize("fixture", _load_fixtures(), ids=lambda row: row["name"])
def test_calculate_line_total_matches_canonical_fixture(fixture: dict[str, object]) -> None:
    payload = fixture["input"]
    expected = fixture["expected"]

    input_data = PricingInput(
        quantity=Decimal(payload["quantity"]),
        unit_price=Decimal(payload["unit_price"]),
        item_markup_pct=Decimal(payload["item_markup_pct"]),
        estimate_markup_pct=Decimal(payload["estimate_markup_pct"]),
        discount_value=Decimal(payload["discount_value"]),
        discount_is_percent=bool(payload["discount_is_percent"]),
        tax_rate_pct=Decimal(payload["tax_rate_pct"]),
        labor_hours=Decimal(payload["labor_hours"]),
        labor_rate=Decimal(payload["labor_rate"]),
    )

    result = calculate_line_total(input_data)

    assert result.base_amount == Decimal(expected["base_amount"])
    assert result.with_item_markup == Decimal(expected["with_item_markup"])
    assert result.with_estimate_markup == Decimal(expected["with_estimate_markup"])
    assert result.discount_amount == Decimal(expected["discount_amount"])
    assert result.labor_amount == Decimal(expected["labor_amount"])
    assert result.taxable_subtotal == Decimal(expected["taxable_subtotal"])
    assert result.tax_amount == Decimal(expected["tax_amount"])
    assert result.line_total == Decimal(expected["line_total"])
