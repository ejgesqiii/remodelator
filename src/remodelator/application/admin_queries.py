from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from remodelator.application.auth_security import role_for_email
from remodelator.infra.models import AuditEvent
from remodelator.infra.models import BillingEvent
from remodelator.infra.models import CatalogItem
from remodelator.infra.models import CatalogNode
from remodelator.infra.models import Estimate
from remodelator.infra.models import EstimateLineItem
from remodelator.infra.models import User


def _format_money(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):.2f}"


def _normalize_optional_filter(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def admin_summary(session: Session) -> dict[str, object]:
    users = session.execute(select(func.count()).select_from(User)).scalar_one()
    estimates = session.execute(select(func.count()).select_from(Estimate)).scalar_one()
    line_items = session.execute(select(func.count()).select_from(EstimateLineItem)).scalar_one()
    billing_events = session.execute(select(func.count()).select_from(BillingEvent)).scalar_one()
    total_billed = session.execute(select(func.coalesce(func.sum(BillingEvent.amount), 0))).scalar_one()
    catalog_nodes = session.execute(select(func.count()).select_from(CatalogNode)).scalar_one()
    catalog_items = session.execute(select(func.count()).select_from(CatalogItem)).scalar_one()

    return {
        "users": int(users or 0),
        "estimates": int(estimates or 0),
        "line_items": int(line_items or 0),
        "billing_events": int(billing_events or 0),
        "billing_total_amount": _format_money(Decimal(str(total_billed or 0))),
        "catalog_nodes": int(catalog_nodes or 0),
        "catalog_items": int(catalog_items or 0),
    }


def admin_users(session: Session, limit: int = 200, search: str | None = None) -> list[dict[str, object]]:
    estimate_counts = (
        select(
            Estimate.user_id.label("user_id"),
            func.count().label("estimates_count"),
        )
        .group_by(Estimate.user_id)
        .subquery()
    )
    billing_counts = (
        select(
            BillingEvent.user_id.label("user_id"),
            func.count().label("billing_events_count"),
        )
        .group_by(BillingEvent.user_id)
        .subquery()
    )
    audit_rollup = (
        select(
            AuditEvent.user_id.label("user_id"),
            func.count().label("audit_events_count"),
            func.max(AuditEvent.created_at).label("last_activity_at"),
            func.max(
                case(
                    (AuditEvent.action == "login", AuditEvent.created_at),
                    else_=None,
                )
            ).label("last_login_at"),
        )
        .group_by(AuditEvent.user_id)
        .subquery()
    )

    query = (
        select(
            User,
            func.coalesce(estimate_counts.c.estimates_count, 0).label("estimates_count"),
            func.coalesce(billing_counts.c.billing_events_count, 0).label("billing_events_count"),
            func.coalesce(audit_rollup.c.audit_events_count, 0).label("audit_events_count"),
            audit_rollup.c.last_login_at.label("last_login_at"),
            audit_rollup.c.last_activity_at.label("last_activity_at"),
        )
        .outerjoin(estimate_counts, estimate_counts.c.user_id == User.id)
        .outerjoin(billing_counts, billing_counts.c.user_id == User.id)
        .outerjoin(audit_rollup, audit_rollup.c.user_id == User.id)
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    search_clean = _normalize_optional_filter(search)
    if search_clean:
        pattern = f"%{search_clean.lower()}%"
        query = query.where(func.lower(User.email).like(pattern) | func.lower(User.full_name).like(pattern))
    rows = session.execute(query).all()
    payload: list[dict[str, object]] = []
    for user, estimates_count, billing_events_count, audit_events_count, last_login_at, last_activity_at in rows:
        payload.append(
            {
                "id": user.id,
                "email": user.email,
                "role": role_for_email(user.email),
                "full_name": user.full_name,
                "created_at": user.created_at.isoformat(),
                "estimates_count": int(estimates_count or 0),
                "billing_events_count": int(billing_events_count or 0),
                "audit_events_count": int(audit_events_count or 0),
                "last_login_at": last_login_at.isoformat() if last_login_at else None,
                "last_activity_at": last_activity_at.isoformat() if last_activity_at else None,
                "stripe_customer_id": user.stripe_customer_id,
                "stripe_subscription_id": user.stripe_subscription_id,
            }
        )
    return payload


def admin_activity(
    session: Session,
    limit: int = 200,
    user_id: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
) -> list[dict[str, str]]:
    query: Select[tuple[AuditEvent]] = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)

    user_id_clean = _normalize_optional_filter(user_id)
    action_clean = _normalize_optional_filter(action)
    entity_type_clean = _normalize_optional_filter(entity_type)

    if user_id_clean:
        query = query.where(AuditEvent.user_id == user_id_clean)
    if action_clean:
        query = query.where(AuditEvent.action == action_clean)
    if entity_type_clean:
        query = query.where(AuditEvent.entity_type == entity_type_clean)

    rows = session.execute(query).scalars().all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "details": row.details,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


def list_billing_ledger_admin(
    session: Session,
    limit: int = 200,
    user_id: str | None = None,
    event_type: str | None = None,
) -> list[dict[str, str]]:
    query: Select[tuple[BillingEvent]] = select(BillingEvent).order_by(BillingEvent.created_at.desc()).limit(limit)
    user_id_clean = _normalize_optional_filter(user_id)
    event_type_clean = _normalize_optional_filter(event_type)
    if user_id_clean:
        query = query.where(BillingEvent.user_id == user_id_clean)
    if event_type_clean:
        query = query.where(BillingEvent.event_type == event_type_clean)
    rows = session.execute(query).scalars().all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "event_type": row.event_type,
            "amount": _format_money(row.amount),
            "currency": row.currency,
            "details": row.details,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
