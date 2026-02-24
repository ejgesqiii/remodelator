from __future__ import annotations

from remodelator.infra.models import Estimate
from remodelator.infra.models import EstimateLineItem


def estimate_to_dict(est: Estimate, include_lines: bool = True) -> dict[str, object]:
    payload: dict[str, object] = {
        "id": est.id,
        "title": est.title,
        "status": est.status,
        "version": est.version,
        "customer_name": est.customer_name,
        "customer_email": est.customer_email,
        "customer_phone": est.customer_phone,
        "job_address": est.job_address,
        "estimate_markup_pct": str(est.estimate_markup_pct),
        "tax_rate_pct": str(est.tax_rate_pct),
        "subtotal": str(est.subtotal),
        "tax": str(est.tax),
        "total": str(est.total),
        "updated_at": est.updated_at.isoformat() if est.updated_at else None,
    }
    if include_lines:
        payload["line_items"] = [line_item_to_dict(x) for x in sorted(est.line_items, key=lambda i: i.sort_order)]
    return payload


def line_item_to_dict(li: EstimateLineItem) -> dict[str, object]:
    return {
        "id": li.id,
        "estimate_id": li.estimate_id,
        "sort_order": li.sort_order,
        "group_name": li.group_name,
        "item_name": li.item_name,
        "quantity": str(li.quantity),
        "unit_price": str(li.unit_price),
        "item_markup_pct": str(li.item_markup_pct),
        "discount_value": str(li.discount_value),
        "discount_is_percent": bool(li.discount_is_percent),
        "labor_hours": str(li.labor_hours),
        "labor_rate": str(li.labor_rate),
        "total_price": str(li.total_price),
    }
