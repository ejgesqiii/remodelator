from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

MONEY_QUANT = Decimal("0.01")
RATE_QUANT = Decimal("0.0001")


def d(value: object) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def rate(value: Decimal) -> Decimal:
    return value.quantize(RATE_QUANT, rounding=ROUND_HALF_UP)


@dataclass(slots=True)
class PricingInput:
    quantity: Decimal
    unit_price: Decimal
    item_markup_pct: Decimal
    estimate_markup_pct: Decimal
    discount_value: Decimal
    discount_is_percent: bool
    tax_rate_pct: Decimal
    labor_hours: Decimal
    labor_rate: Decimal


@dataclass(slots=True)
class PricingOutput:
    base_amount: Decimal
    with_item_markup: Decimal
    with_estimate_markup: Decimal
    discount_amount: Decimal
    labor_amount: Decimal
    taxable_subtotal: Decimal
    tax_amount: Decimal
    line_total: Decimal


def calculate_line_total(pricing: PricingInput) -> PricingOutput:
    # Canonical default order:
    # a) base = unit_price * quantity
    # b) item markup
    # c) estimate markup
    # d) discount
    # e) tax
    # f) labor
    base = d(pricing.unit_price) * d(pricing.quantity)
    with_item_markup = base * (Decimal("1") + rate(d(pricing.item_markup_pct)) / Decimal("100"))
    with_estimate_markup = with_item_markup * (
        Decimal("1") + rate(d(pricing.estimate_markup_pct)) / Decimal("100")
    )

    if pricing.discount_is_percent:
        discount_amount = with_estimate_markup * (rate(d(pricing.discount_value)) / Decimal("100"))
    else:
        discount_amount = d(pricing.discount_value)

    discount_amount = min(discount_amount, with_estimate_markup)

    labor_amount = d(pricing.labor_hours) * d(pricing.labor_rate)
    taxable_subtotal = with_estimate_markup - discount_amount + labor_amount
    tax_amount = taxable_subtotal * (rate(d(pricing.tax_rate_pct)) / Decimal("100"))
    line_total = taxable_subtotal + tax_amount

    return PricingOutput(
        base_amount=money(base),
        with_item_markup=money(with_item_markup),
        with_estimate_markup=money(with_estimate_markup),
        discount_amount=money(discount_amount),
        labor_amount=money(labor_amount),
        taxable_subtotal=money(taxable_subtotal),
        tax_amount=money(tax_amount),
        line_total=money(line_total),
    )
