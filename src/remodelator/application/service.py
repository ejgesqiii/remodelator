from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from uuid import uuid4

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from remodelator.application.admin_queries import admin_activity  # noqa: F401
from remodelator.application.admin_queries import admin_summary  # noqa: F401
from remodelator.application.admin_queries import admin_users  # noqa: F401
from remodelator.application.admin_queries import list_billing_ledger_admin  # noqa: F401
from remodelator.application.auth_security import hash_password as _hash_password
from remodelator.application.auth_security import is_legacy_sha256_hash as _is_legacy_sha256_hash
from remodelator.application.auth_security import issue_session_token as _issue_session_token
from remodelator.application.billing_policy import billing_provider_status_payload
from remodelator.application.billing_policy import SIMULATED_GATEWAY_EVENT_TYPES
from remodelator.application.billing_policy import SUBSCRIPTION_LIFECYCLE_EVENT_TYPES
from remodelator.application.billing_policy import validate_gateway_lifecycle_transition
from remodelator.config import get_settings
from remodelator.domain.pricing import PricingInput, calculate_line_total, d
from remodelator.application.auth_security import normalize_password as _normalize_password
from remodelator.application.auth_security import resolve_user_id_from_session_token  # noqa: F401
from remodelator.application.auth_security import role_for_email
from remodelator.application.auth_security import verify_admin_key  # noqa: F401
from remodelator.application.auth_security import verify_password as _verify_password
from remodelator.application.migration_reconcile import load_snapshot_file  # noqa: F401
from remodelator.application.migration_reconcile import migrate_legacy_sql_stub  # noqa: F401
from remodelator.application.migration_reconcile import reconcile_database_files  # noqa: F401
from remodelator.application.migration_reconcile import reconcile_snapshot_files  # noqa: F401
from remodelator.application.migration_reconcile import reconcile_stub  # noqa: F401
from remodelator.application.llm_policy import clamp_suggested_unit_price
from remodelator.application.llm_policy import llm_provider_status_payload
from remodelator.application.serializers import estimate_to_dict, line_item_to_dict
from remodelator.infra.db import Base, create_schema, engine, session_scope
from remodelator.infra.llm.openrouter import suggest_price as suggest_price_openrouter
from remodelator.infra.models import (
    AuditEvent,
    BillingEvent,
    CatalogItem,
    CatalogNode,
    Estimate,
    EstimateLineItem,
    IdempotencyRecord,
    Template,
    TemplateLineItem,
    User,
)
from remodelator.infra.operation_lock import operation_lock
from remodelator.interfaces.api.errors import CriticalDependencyError


def _uid() -> str:
    return str(uuid4())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _format_money(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):.2f}"


def _resolve_output_path(output_path: Path | None, default_filename: str) -> Path:
    settings = get_settings()
    data_root = settings.data_dir.resolve()
    default_path = data_root / "demo_outputs" / default_filename

    raw_path = output_path or default_path
    resolved = raw_path.resolve() if raw_path.is_absolute() else (data_root / raw_path).resolve()

    if not resolved.is_relative_to(data_root):
        raise ValueError(f"Output path must be inside the data directory: {data_root}")

    resolved.parent.mkdir(parents=True, exist_ok=True)
    return resolved


def _require_user(session: Session, user_id: str | None) -> User:
    if not user_id:
        raise ValueError("No active session. Run `remodelator auth login` first.")
    user = session.get(User, user_id)
    if not user:
        raise ValueError("Active session user not found.")
    return user


def role_for_user(session: Session, user_id: str) -> str:
    user = _require_user(session, user_id)
    return role_for_email(user.email)


def require_admin_user_access(session: Session, user_id: str) -> None:
    if role_for_user(session, user_id) != "admin":
        raise ValueError("Admin access requires an admin-role session or valid x-admin-key.")


def _audit(session: Session, user_id: str, action: str, entity_type: str, entity_id: str, details: str = "") -> None:
    event = AuditEvent(
        id=_uid(),
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    session.add(event)


def init_db() -> dict[str, str]:
    create_schema()
    return {"status": "ok", "timestamp": _now_iso()}


def rebuild_demo_database() -> dict[str, object]:
    settings = get_settings()
    with operation_lock("admin-db-rebuild", settings.data_dir, settings.operation_lock_timeout_seconds):
        Base.metadata.drop_all(bind=engine)
        payload = init_db()
        with session_scope() as session:
            seeded = seed_catalog(session)
        return {"status": payload["status"], "seeded": seeded}


def seed_catalog(session: Session) -> dict[str, int]:
    roots = [
        "Bathroom",
        "Kitchen",
        "Basement",
        "Attic",
        "Exterior",
        "Doors/Windows",
        "Landscaping",
    ]
    existing = session.execute(select(func.count()).select_from(CatalogNode)).scalar_one()
    if existing and existing > 0:
        return {"nodes": 0, "items": 0}

    node_ids: dict[str, str] = {}
    for root in roots:
        node_id = _uid()
        node_ids[root] = node_id
        session.add(CatalogNode(id=node_id, name=root, parent_id=None))
    session.flush()

    starter_items = [
        ("Bathroom", "Shower Tile", "Ceramic shower tile install", Decimal("14.50"), Decimal("1.2")),
        ("Kitchen", "Countertop Install", "Quartz countertop install", Decimal("85.00"), Decimal("2.5")),
        ("Basement", "Drywall Finish", "Drywall tape and finish", Decimal("3.75"), Decimal("0.4")),
        ("Attic", "Insulation Upgrade", "Blown-in insulation", Decimal("2.20"), Decimal("0.3")),
        ("Exterior", "Siding Repair", "Fiber cement patch and replace", Decimal("18.25"), Decimal("0.9")),
        ("Doors/Windows", "Window Replacement", "Double-pane replacement window", Decimal("420.00"), Decimal("2.0")),
        ("Landscaping", "Drainage Trench", "French drain installation", Decimal("22.00"), Decimal("1.5")),
    ]

    for cat, name, desc, unit_price, labor_hours in starter_items:
        session.add(
            CatalogItem(
                id=_uid(),
                node_id=node_ids[cat],
                name=name,
                description=desc,
                unit_price=unit_price,
                labor_hours=labor_hours,
            )
        )

    return {"nodes": len(roots), "items": len(starter_items)}


def register_user(session: Session, email: str, password: str, full_name: str = "") -> dict[str, str]:
    email_clean = email.strip().lower()
    password_clean = _normalize_password(password)
    exists = session.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if exists:
        raise ValueError("User already exists for this email.")

    user = User(
        id=_uid(),
        email=email_clean,
        password_hash=_hash_password(password_clean),
        full_name=full_name,
        labor_rate=Decimal("75.00"),
        default_item_markup_pct=Decimal("10.00"),
        default_estimate_markup_pct=Decimal("5.00"),
        tax_rate_pct=Decimal("8.25"),
    )
    session.add(user)
    session.flush()
    _audit(session, user.id, "register", "user", user.id)
    return {
        "user_id": user.id,
        "email": user.email,
        "role": role_for_email(user.email),
        "session_token": _issue_session_token(user.id),
    }


def login_user(session: Session, email: str, password: str) -> dict[str, str]:
    email_clean = email.strip().lower()
    password_clean = password.strip()
    user = session.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if not user or not _verify_password(user.password_hash, password_clean):
        raise ValueError("Invalid credentials.")
    if _is_legacy_sha256_hash(user.password_hash):
        user.password_hash = _hash_password(password_clean)
    _audit(session, user.id, "login", "user", user.id)
    return {
        "user_id": user.id,
        "email": user.email,
        "role": role_for_email(user.email),
        "session_token": _issue_session_token(user.id),
    }


def get_profile(session: Session, user_id: str) -> dict[str, object]:
    user = _require_user(session, user_id)
    return {
        "id": user.id,
        "email": user.email,
        "role": role_for_email(user.email),
        "full_name": user.full_name,
        "labor_rate": str(user.labor_rate),
        "default_item_markup_pct": str(user.default_item_markup_pct),
        "default_estimate_markup_pct": str(user.default_estimate_markup_pct),
        "tax_rate_pct": str(user.tax_rate_pct),
    }


def update_profile(
    session: Session,
    user_id: str,
    full_name: str | None,
    labor_rate: Decimal | None,
    item_markup_pct: Decimal | None,
    estimate_markup_pct: Decimal | None,
    tax_rate_pct: Decimal | None,
) -> dict[str, object]:
    user = _require_user(session, user_id)

    if full_name is not None:
        user.full_name = full_name
    if labor_rate is not None:
        user.labor_rate = labor_rate
    if item_markup_pct is not None:
        user.default_item_markup_pct = item_markup_pct
    if estimate_markup_pct is not None:
        user.default_estimate_markup_pct = estimate_markup_pct
    if tax_rate_pct is not None:
        user.tax_rate_pct = tax_rate_pct

    _audit(session, user.id, "profile.update", "user", user.id)
    return get_profile(session, user.id)


def create_estimate(
    session: Session,
    user_id: str,
    title: str,
    customer_name: str = "",
    customer_email: str = "",
    customer_phone: str = "",
    job_address: str = "",
) -> dict[str, object]:
    user = _require_user(session, user_id)
    est = Estimate(
        id=_uid(),
        user_id=user.id,
        title=title,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        job_address=job_address,
        status="draft",
        estimate_markup_pct=user.default_estimate_markup_pct,
        tax_rate_pct=user.tax_rate_pct,
        subtotal=Decimal("0"),
        tax=Decimal("0"),
        total=Decimal("0"),
    )
    session.add(est)
    session.flush()
    _audit(session, user.id, "estimate.create", "estimate", est.id)
    return estimate_to_dict(est)


def quickstart_estimate_from_catalog(
    session: Session,
    user_id: str,
    estimate_id: str,
    catalog_node_name: str,
    max_items: int = 5,
) -> dict[str, object]:
    user = _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user.id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    normalized_name = catalog_node_name.strip()
    if not normalized_name:
        raise ValueError("Catalog node name is required.")

    capped_max_items = max(1, min(int(max_items), 50))
    node = session.execute(
        select(CatalogNode).where(func.lower(CatalogNode.name) == normalized_name.lower())
    ).scalar_one_or_none()
    if not node:
        raise ValueError(f"Catalog node `{normalized_name}` not found.")

    items = session.execute(
        select(CatalogItem)
        .where(CatalogItem.node_id == node.id)
        .order_by(CatalogItem.name.asc())
        .limit(capped_max_items)
    ).scalars().all()
    if not items:
        raise ValueError(f"Catalog node `{node.name}` has no items to apply.")

    existing_count = session.execute(
        select(func.count()).select_from(EstimateLineItem).where(EstimateLineItem.estimate_id == estimate_id)
    ).scalar_one()
    for offset, item in enumerate(items):
        session.add(
            EstimateLineItem(
                id=_uid(),
                estimate_id=estimate_id,
                sort_order=int(existing_count) + offset,
                group_name=node.name,
                item_name=item.name,
                quantity=Decimal("1"),
                unit_price=d(item.unit_price),
                item_markup_pct=d(user.default_item_markup_pct),
                labor_hours=d(item.labor_hours),
                labor_rate=d(user.labor_rate),
                discount_value=Decimal("0"),
                discount_is_percent=False,
                total_price=Decimal("0"),
            )
        )

    recalc_estimate(session, user_id, estimate_id)
    _audit(
        session,
        user_id,
        "estimate.quickstart.catalog_node",
        "estimate",
        estimate_id,
        details=f"node={node.name};added={len(items)}",
    )
    return get_estimate(session, user_id, estimate_id)


def list_estimates(session: Session, user_id: str) -> list[dict[str, object]]:
    _require_user(session, user_id)
    rows = session.execute(select(Estimate).where(Estimate.user_id == user_id).order_by(Estimate.created_at.desc())).scalars().all()
    return [estimate_to_dict(row, include_lines=False) for row in rows]


def get_estimate(session: Session, user_id: str, estimate_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    payload = estimate_to_dict(est, include_lines=False)
    lines = session.execute(_line_select(est.id)).scalars().all()
    payload["line_items"] = [line_item_to_dict(x) for x in lines]
    return payload


def update_estimate(
    session: Session,
    user_id: str,
    estimate_id: str,
    title: str | None,
    customer_name: str | None,
    customer_email: str | None,
    customer_phone: str | None,
    job_address: str | None,
    estimate_markup_pct: Decimal | None,
    tax_rate_pct: Decimal | None,
) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    if title is not None:
        est.title = title
    if customer_name is not None:
        est.customer_name = customer_name
    if customer_email is not None:
        est.customer_email = customer_email
    if customer_phone is not None:
        est.customer_phone = customer_phone
    if job_address is not None:
        est.job_address = job_address
    if estimate_markup_pct is not None:
        est.estimate_markup_pct = estimate_markup_pct
    if tax_rate_pct is not None:
        est.tax_rate_pct = tax_rate_pct

    est.version += 1
    recalc_estimate(session, user_id, est.id)
    _audit(session, user_id, "estimate.update", "estimate", est.id)
    return estimate_to_dict(est)


def change_estimate_status(session: Session, user_id: str, estimate_id: str, new_status: str) -> dict[str, object]:
    _require_user(session, user_id)
    allowed = {"draft", "in_progress", "completed", "locked"}
    if new_status not in allowed:
        raise ValueError(f"Unsupported status `{new_status}`.")

    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")

    if est.status == "locked" and new_status != "locked":
        raise ValueError("Locked estimate requires explicit unlock action.")

    est.status = new_status
    est.version += 1
    _audit(session, user_id, f"estimate.status.{new_status}", "estimate", est.id)
    return estimate_to_dict(est)


def unlock_estimate(session: Session, user_id: str, estimate_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    est.status = "in_progress"
    est.version += 1
    _audit(session, user_id, "estimate.unlock", "estimate", est.id)
    return estimate_to_dict(est)


def _line_select(estimate_id: str) -> Select[tuple[EstimateLineItem]]:
    return select(EstimateLineItem).where(EstimateLineItem.estimate_id == estimate_id).order_by(EstimateLineItem.sort_order.asc())


def add_line_item(
    session: Session,
    user_id: str,
    estimate_id: str,
    item_name: str,
    quantity: Decimal,
    unit_price: Decimal,
    item_markup_pct: Decimal | None,
    labor_hours: Decimal,
    discount_value: Decimal,
    discount_is_percent: bool,
    group_name: str,
) -> dict[str, object]:
    user = _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user.id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    existing_count = session.execute(select(func.count()).select_from(EstimateLineItem).where(EstimateLineItem.estimate_id == estimate_id)).scalar_one()
    markup = item_markup_pct if item_markup_pct is not None else d(user.default_item_markup_pct)

    li = EstimateLineItem(
        id=_uid(),
        estimate_id=estimate_id,
        sort_order=int(existing_count),
        group_name=group_name,
        item_name=item_name,
        quantity=quantity,
        unit_price=unit_price,
        item_markup_pct=markup,
        labor_hours=labor_hours,
        labor_rate=d(user.labor_rate),
        discount_value=discount_value,
        discount_is_percent=discount_is_percent,
        total_price=Decimal("0"),
    )
    session.add(li)
    recalc_estimate(session, user_id, estimate_id)
    _audit(session, user_id, "line_item.add", "estimate_line_item", li.id)
    session.flush()
    return line_item_to_dict(li)


def edit_line_item(
    session: Session,
    user_id: str,
    estimate_id: str,
    line_item_id: str,
    quantity: Decimal | None,
    unit_price: Decimal | None,
    item_markup_pct: Decimal | None,
    labor_hours: Decimal | None,
    discount_value: Decimal | None,
    discount_is_percent: bool | None,
    group_name: str | None,
) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    li = session.get(EstimateLineItem, line_item_id)
    if not li or li.estimate_id != estimate_id:
        raise ValueError("Line item not found.")

    if quantity is not None:
        li.quantity = quantity
    if unit_price is not None:
        li.unit_price = unit_price
    if item_markup_pct is not None:
        li.item_markup_pct = item_markup_pct
    if labor_hours is not None:
        li.labor_hours = labor_hours
    if discount_value is not None:
        li.discount_value = discount_value
    if discount_is_percent is not None:
        li.discount_is_percent = discount_is_percent
    if group_name is not None:
        li.group_name = group_name

    recalc_estimate(session, user_id, estimate_id)
    _audit(session, user_id, "line_item.edit", "estimate_line_item", li.id)
    return line_item_to_dict(li)


def remove_line_item(session: Session, user_id: str, estimate_id: str, line_item_id: str) -> dict[str, str]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    li = session.get(EstimateLineItem, line_item_id)
    if not li or li.estimate_id != estimate_id:
        raise ValueError("Line item not found.")

    session.delete(li)
    remaining = session.execute(_line_select(estimate_id)).scalars().all()
    for idx, item in enumerate(remaining):
        item.sort_order = idx

    recalc_estimate(session, user_id, estimate_id)
    _audit(session, user_id, "line_item.remove", "estimate_line_item", line_item_id)
    return {"status": "deleted", "line_item_id": line_item_id}


def reorder_line_item(
    session: Session,
    user_id: str,
    estimate_id: str,
    line_item_id: str,
    new_index: int,
) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    lines = session.execute(_line_select(estimate_id)).scalars().all()
    if not lines:
        raise ValueError("No line items to reorder.")

    current_idx = next((idx for idx, line in enumerate(lines) if line.id == line_item_id), None)
    if current_idx is None:
        raise ValueError("Line item not found.")

    target_idx = max(0, min(new_index, len(lines) - 1))
    line = lines.pop(current_idx)
    lines.insert(target_idx, line)

    for idx, item in enumerate(lines):
        item.sort_order = idx

    recalc_estimate(session, user_id, estimate_id)
    _audit(
        session,
        user_id,
        "line_item.reorder",
        "estimate_line_item",
        line_item_id,
        details=f"from={current_idx};to={target_idx}",
    )
    return estimate_to_dict(est)


def group_line_item(
    session: Session,
    user_id: str,
    estimate_id: str,
    group_name: str,
    line_item_id: str | None = None,
) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    changed = 0
    if line_item_id:
        li = session.get(EstimateLineItem, line_item_id)
        if not li or li.estimate_id != estimate_id:
            raise ValueError("Line item not found.")
        li.group_name = group_name
        changed = 1
    else:
        for li in session.execute(_line_select(estimate_id)).scalars().all():
            li.group_name = group_name
            changed += 1

    recalc_estimate(session, user_id, estimate_id)
    _audit(
        session,
        user_id,
        "line_item.group",
        "estimate",
        estimate_id,
        details=f"group={group_name};changed={changed}",
    )
    return estimate_to_dict(est)


def recalc_estimate(session: Session, user_id: str, estimate_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    # Session autoflush is disabled globally, so flush pending mutations before pricing queries.
    session.flush()

    subtotal = Decimal("0")
    total_tax = Decimal("0")
    total = Decimal("0")

    for li in session.execute(_line_select(estimate_id)).scalars().all():
        calc = calculate_line_total(
            PricingInput(
                quantity=d(li.quantity),
                unit_price=d(li.unit_price),
                item_markup_pct=d(li.item_markup_pct),
                estimate_markup_pct=d(est.estimate_markup_pct),
                discount_value=d(li.discount_value),
                discount_is_percent=bool(li.discount_is_percent),
                tax_rate_pct=d(est.tax_rate_pct),
                labor_hours=d(li.labor_hours),
                labor_rate=d(li.labor_rate),
            )
        )
        li.total_price = calc.line_total
        subtotal += calc.taxable_subtotal
        total_tax += calc.tax_amount
        total += calc.line_total

    est.subtotal = subtotal
    est.tax = total_tax
    est.total = total
    _audit(session, user_id, "estimate.recalc", "estimate", estimate_id)
    return estimate_to_dict(est)


def duplicate_estimate(session: Session, user_id: str, estimate_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    source = session.get(Estimate, estimate_id)
    if not source or source.user_id != user_id:
        raise ValueError("Estimate not found.")

    copy = Estimate(
        id=_uid(),
        user_id=source.user_id,
        title=f"{source.title} (Copy)",
        customer_name=source.customer_name,
        customer_email=source.customer_email,
        customer_phone=source.customer_phone,
        job_address=source.job_address,
        status="draft",
        estimate_markup_pct=source.estimate_markup_pct,
        tax_rate_pct=source.tax_rate_pct,
        subtotal=Decimal("0"),
        tax=Decimal("0"),
        total=Decimal("0"),
    )
    session.add(copy)
    session.flush()

    lines = session.execute(_line_select(source.id)).scalars().all()
    for line in lines:
        session.add(
            EstimateLineItem(
                id=_uid(),
                estimate_id=copy.id,
                sort_order=line.sort_order,
                group_name=line.group_name,
                item_name=line.item_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                item_markup_pct=line.item_markup_pct,
                discount_value=line.discount_value,
                discount_is_percent=line.discount_is_percent,
                labor_hours=line.labor_hours,
                labor_rate=line.labor_rate,
                total_price=Decimal("0"),
            )
        )

    recalc_estimate(session, user_id, copy.id)
    _audit(session, user_id, "estimate.duplicate", "estimate", copy.id, details=f"source={source.id}")
    return estimate_to_dict(copy)


def create_estimate_version(session: Session, user_id: str, estimate_id: str) -> dict[str, object]:
    payload = duplicate_estimate(session, user_id, estimate_id)
    source = session.get(Estimate, estimate_id)
    version_estimate = session.get(Estimate, payload["id"])
    if source and version_estimate:
        version_estimate.title = f"{source.title} v{source.version + 1}"
        source.version += 1
        _audit(
            session,
            user_id,
            "estimate.version",
            "estimate",
            version_estimate.id,
            details=f"source={source.id};source_version={source.version}",
        )
    return estimate_to_dict(version_estimate) if version_estimate else payload


def export_estimate_json(session: Session, user_id: str, estimate_id: str, output_path: Path) -> dict[str, str]:
    payload = get_estimate(session, user_id, estimate_id)
    safe_path = _resolve_output_path(output_path, f"estimate_{estimate_id}.json")
    safe_path.write_text(json.dumps(payload, indent=2))
    _audit(session, user_id, "estimate.export", "estimate", estimate_id, details=str(safe_path))
    return {"path": str(safe_path), "estimate_id": estimate_id}


def save_template_from_estimate(session: Session, user_id: str, estimate_id: str, template_name: str) -> dict[str, str]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")

    template = Template(id=_uid(), user_id=user_id, name=template_name)
    session.add(template)
    session.flush()

    lines = session.execute(_line_select(estimate_id)).scalars().all()
    for line in lines:
        session.add(
            TemplateLineItem(
                id=_uid(),
                template_id=template.id,
                sort_order=line.sort_order,
                group_name=line.group_name,
                item_name=line.item_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                item_markup_pct=line.item_markup_pct,
                labor_hours=line.labor_hours,
            )
        )

    _audit(session, user_id, "template.save", "template", template.id)
    return {"template_id": template.id, "name": template.name}


def list_templates(session: Session, user_id: str, limit: int = 100) -> list[dict[str, object]]:
    _require_user(session, user_id)
    line_counts = (
        select(TemplateLineItem.template_id, func.count().label("line_count"))
        .group_by(TemplateLineItem.template_id)
        .subquery()
    )
    rows = session.execute(
        select(Template, func.coalesce(line_counts.c.line_count, 0))
        .outerjoin(line_counts, line_counts.c.template_id == Template.id)
        .where(Template.user_id == user_id)
        .order_by(Template.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": template.id,
            "name": template.name,
            "line_item_count": int(line_count or 0),
            "created_at": template.created_at.isoformat(),
        }
        for template, line_count in rows
    ]


def apply_template_to_estimate(session: Session, user_id: str, template_id: str, estimate_id: str) -> dict[str, object]:
    user = _require_user(session, user_id)
    template = session.get(Template, template_id)
    est = session.get(Estimate, estimate_id)
    if not template or template.user_id != user_id:
        raise ValueError("Template not found.")
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    lines = session.execute(select(TemplateLineItem).where(TemplateLineItem.template_id == template_id).order_by(TemplateLineItem.sort_order.asc())).scalars().all()
    for idx, line in enumerate(lines):
        session.add(
            EstimateLineItem(
                id=_uid(),
                estimate_id=estimate_id,
                sort_order=idx,
                group_name=line.group_name,
                item_name=line.item_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                item_markup_pct=line.item_markup_pct,
                labor_hours=line.labor_hours,
                labor_rate=user.labor_rate,
                discount_value=Decimal("0"),
                discount_is_percent=False,
                total_price=Decimal("0"),
            )
        )

    recalc_estimate(session, user_id, estimate_id)
    _audit(session, user_id, "template.apply", "estimate", estimate_id, details=f"template={template_id}")
    return get_estimate(session, user_id, estimate_id)


def upsert_catalog_item(
    session: Session,
    user_id: str,
    name: str,
    unit_price: Decimal,
    labor_hours: Decimal,
    description: str,
    node_id: str | None = None,
) -> dict[str, str]:
    _require_user(session, user_id)
    clean_name = name.strip()
    if not clean_name:
        raise ValueError("Catalog item name is required.")

    item = session.execute(select(CatalogItem).where(CatalogItem.name == clean_name)).scalar_one_or_none()
    if item is None:
        item = CatalogItem(
            id=_uid(),
            node_id=node_id,
            name=clean_name,
            unit_price=unit_price,
            labor_hours=labor_hours,
            description=description,
        )
        session.add(item)
        action = "catalog.item.create"
    else:
        item.node_id = node_id
        item.unit_price = unit_price
        item.labor_hours = labor_hours
        item.description = description
        action = "catalog.item.update"

    _audit(session, user_id, action, "catalog_item", item.id)
    return {"item_id": item.id, "name": item.name, "action": action}


def search_catalog_items(session: Session, query: str, limit: int = 20) -> list[dict[str, str]]:
    like = f"%{query.strip()}%"
    rows = session.execute(select(CatalogItem).where(CatalogItem.name.ilike(like)).order_by(CatalogItem.name.asc()).limit(limit)).scalars().all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "unit_price": str(row.unit_price),
            "labor_hours": str(row.labor_hours),
        }
        for row in rows
    ]


def import_catalog_json(session: Session, user_id: str, path: Path) -> dict[str, int]:
    payload = json.loads(path.read_text())
    return import_catalog_items(session, user_id, payload.get("items", []))


def import_catalog_items(session: Session, user_id: str, items: list[dict[str, object]]) -> dict[str, int]:
    _require_user(session, user_id)
    inserted = 0
    updated = 0

    for item in items:
        result = upsert_catalog_item(
            session=session,
            user_id=user_id,
            name=str(item.get("name", "")),
            unit_price=d(item.get("unit_price", 0)),
            labor_hours=d(item.get("labor_hours", 0)),
            description=str(item.get("description", "")),
            node_id=str(item.get("node_id")) if item.get("node_id") else None,
        )
        if result["action"] == "catalog.item.create":
            inserted += 1
        else:
            updated += 1

    _audit(session, user_id, "catalog.import", "catalog", "bulk", details=f"inserted={inserted};updated={updated}")
    return {"inserted": inserted, "updated": updated}


def show_catalog_tree(session: Session) -> list[dict[str, object]]:
    nodes = session.execute(select(CatalogNode).order_by(CatalogNode.name.asc())).scalars().all()
    items = session.execute(select(CatalogItem).order_by(CatalogItem.name.asc())).scalars().all()

    by_node: dict[str, list[dict[str, str]]] = {}
    for item in items:
        key = item.node_id or "unassigned"
        by_node.setdefault(key, []).append({"id": item.id, "name": item.name})

    result: list[dict[str, object]] = []
    for node in nodes:
        result.append(
            {
                "node_id": node.id,
                "name": node.name,
                "items": by_node.get(node.id, []),
            }
        )
    if by_node.get("unassigned"):
        result.append({"node_id": None, "name": "Unassigned", "items": by_node["unassigned"]})
    return result


def render_proposal_text(session: Session, user_id: str, estimate_id: str) -> str:
    est_data = get_estimate(session, user_id, estimate_id)
    lines = [
        f"Proposal: {est_data['title']}",
        f"Estimate ID: {est_data['id']}",
        f"Customer: {est_data['customer_name']}",
        f"Status: {est_data['status']}",
        "",
        "Line Items:",
    ]

    for li in est_data["line_items"]:
        lines.append(
            f"- {li['item_name']} | qty={li['quantity']} | unit=${li['unit_price']} | total=${li['total_price']}"
        )

    lines.extend(
        [
            "",
            f"Subtotal: ${est_data['subtotal']}",
            f"Tax: ${est_data['tax']}",
            f"Total: ${est_data['total']}",
        ]
    )

    _audit(session, user_id, "proposal.render", "estimate", estimate_id)
    return "\n".join(lines)


def generate_proposal_pdf(session: Session, user_id: str, estimate_id: str, output_path: Path | None = None) -> dict[str, str]:
    proposal_text = render_proposal_text(session, user_id, estimate_id)
    output = _resolve_output_path(output_path, f"proposal_{estimate_id}.pdf")

    c = canvas.Canvas(str(output), pagesize=letter)
    y = 760
    for line in proposal_text.splitlines():
        c.drawString(50, y, line[:95])
        y -= 16
        if y < 50:
            c.showPage()
            y = 760
    c.save()

    _audit(session, user_id, "proposal.pdf", "estimate", estimate_id, details=str(output))
    return {"path": str(output)}


def list_audit_events(session: Session, user_id: str, limit: int = 50) -> list[dict[str, str]]:
    _require_user(session, user_id)
    events = session.execute(
        select(AuditEvent).where(AuditEvent.user_id == user_id).order_by(AuditEvent.created_at.desc()).limit(limit)
    ).scalars().all()
    return [
        {
            "id": e.id,
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


def _lookup_idempotent_billing_event(
    session: Session,
    user_id: str,
    idempotency_key: str | None,
) -> BillingEvent | None:
    if not idempotency_key:
        return None

    existing_key = session.execute(
        select(IdempotencyRecord).where(
            IdempotencyRecord.key == idempotency_key,
            IdempotencyRecord.scope == "billing",
            IdempotencyRecord.user_id == user_id,
        )
    ).scalar_one_or_none()
    if not existing_key or not existing_key.billing_event_id:
        return None
    return session.get(BillingEvent, existing_key.billing_event_id)


def _billing_event_response(
    event: BillingEvent,
    *,
    idempotency_status: str,
    idempotency_key: str | None,
) -> dict[str, str]:
    return {
        "billing_event_id": event.id,
        "event_type": event.event_type,
        "amount": _format_money(event.amount),
        "idempotency_status": idempotency_status,
        "idempotency_key": idempotency_key or "",
    }


def record_billing_event(
    session: Session,
    user_id: str,
    event_type: str,
    amount: Decimal,
    *,
    details: str = "",
    idempotency_key: str | None = None,
    currency: str = "USD",
) -> dict[str, str]:
    _require_user(session, user_id)

    existing_event = _lookup_idempotent_billing_event(session, user_id, idempotency_key)
    if existing_event:
        return _billing_event_response(
            existing_event,
            idempotency_status="replayed",
            idempotency_key=idempotency_key,
        )

    event = BillingEvent(
        id=_uid(),
        user_id=user_id,
        event_type=event_type,
        amount=amount,
        currency=currency,
        details=details,
    )
    session.add(event)
    session.flush()

    if idempotency_key:
        session.add(
            IdempotencyRecord(
                id=_uid(),
                key=idempotency_key,
                scope="billing",
                user_id=user_id,
                billing_event_id=event.id,
            )
        )

    _audit(session, user_id, f"billing.{event_type}", "billing_event", event.id, details=details)
    return _billing_event_response(
        event,
        idempotency_status="created",
        idempotency_key=idempotency_key,
    )


def simulate_billing_event(
    session: Session,
    user_id: str,
    event_type: str,
    amount: Decimal,
    details: str = "",
    idempotency_key: str | None = None,
) -> dict[str, str]:
    _require_user(session, user_id)

    if event_type in SIMULATED_GATEWAY_EVENT_TYPES:
        previous_lifecycle_event = session.execute(
            select(BillingEvent.event_type)
            .where(BillingEvent.user_id == user_id)
            .where(BillingEvent.event_type.in_(tuple(SUBSCRIPTION_LIFECYCLE_EVENT_TYPES)))
            .order_by(BillingEvent.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        validate_gateway_lifecycle_transition(event_type, previous_lifecycle_event)

    return record_billing_event(
        session,
        user_id,
        event_type,
        amount,
        details=details,
        idempotency_key=idempotency_key,
    )


def list_billing_ledger(session: Session, user_id: str, limit: int = 50) -> list[dict[str, str]]:
    _require_user(session, user_id)
    rows = session.execute(
        select(BillingEvent).where(BillingEvent.user_id == user_id).order_by(BillingEvent.created_at.desc()).limit(limit)
    ).scalars().all()
    return [
        {
            "id": row.id,
            "event_type": row.event_type,
            "amount": _format_money(row.amount),
            "currency": row.currency,
            "details": row.details,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


def _extract_subscription_id(details: str) -> str | None:
    for token in details.replace(";", " ").split():
        if token.startswith("subscription_id="):
            value = token.split("=", 1)[1].strip()
            if value:
                return value
    return None


def subscription_state(session: Session, user_id: str, subscription_id: str | None = None) -> dict[str, object]:
    user = _require_user(session, user_id)
    settings = get_settings()
    query = (
        select(BillingEvent)
        .where(BillingEvent.user_id == user_id)
        .order_by(BillingEvent.created_at.desc())
        .limit(200)
    )
    rows = session.execute(query).scalars().all()
    if subscription_id:
        rows = [row for row in rows if f"subscription_id={subscription_id}" in (row.details or "")]

    lifecycle = {
        "subscription",
        "checkout_completed",
        "invoice_paid",
        "invoice_payment_failed",
        "subscription_canceled",
    }
    last = next((row for row in rows if row.event_type in lifecycle), None)
    if not last:
        return {
            "subscription_id": subscription_id,
            "status": "not_started",
            "active": False,
            "canceled": False,
            "past_due": False,
            "last_event_type": None,
            "last_event_amount": None,
            "last_event_at": None,
            "annual_subscription_amount": f"{settings.billing_annual_subscription_amount:.2f}",
            "realtime_pricing_amount": f"{settings.billing_realtime_pricing_amount:.2f}",
            "currency": settings.billing_currency,
        }

    resolved_subscription_id = subscription_id or _extract_subscription_id(last.details) or user.stripe_subscription_id
    status_map = {
        "subscription_canceled": ("canceled", False, True, False),
        "invoice_payment_failed": ("past_due", False, False, True),
        "checkout_completed": ("active", True, False, False),
        "invoice_paid": ("active", True, False, False),
        "subscription": ("active", True, False, False),
    }
    status, active, canceled, past_due = status_map.get(last.event_type, ("unknown", False, False, False))
    return {
        "subscription_id": resolved_subscription_id,
        "status": status,
        "active": active,
        "canceled": canceled,
        "past_due": past_due,
        "last_event_type": last.event_type,
        "last_event_amount": _format_money(last.amount),
        "last_event_at": last.created_at.isoformat(),
        "annual_subscription_amount": f"{settings.billing_annual_subscription_amount:.2f}",
        "realtime_pricing_amount": f"{settings.billing_realtime_pricing_amount:.2f}",
        "currency": settings.billing_currency,
    }


def billing_provider_status() -> dict[str, object]:
    return billing_provider_status_payload(get_settings())


def llm_provider_status() -> dict[str, object]:
    return llm_provider_status_payload(get_settings())


def llm_live_price_suggestion(item_name: str, current_unit_price: Decimal, context: str = "") -> dict[str, str]:
    try:
        return suggest_price_openrouter(item_name=item_name, current_unit_price=current_unit_price, context=context)
    except Exception as exc:
        raise CriticalDependencyError(f"OpenRouter LLM request failed and blocks demo readiness: {exc}") from exc


def apply_llm_suggestion_to_line_item(
    session: Session,
    user_id: str,
    estimate_id: str,
    line_item_id: str,
    suggested_price: Decimal,
) -> dict[str, object]:
    _require_user(session, user_id)
    li = session.get(EstimateLineItem, line_item_id)
    est = session.get(Estimate, estimate_id)
    if not li or li.estimate_id != estimate_id:
        raise ValueError("Line item not found.")
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    bounded = clamp_suggested_unit_price(
        current_price=d(li.unit_price),
        suggested_price=d(suggested_price),
        max_change_pct=get_settings().llm_price_change_max_pct,
    )

    li.unit_price = bounded
    recalc_estimate(session, user_id, estimate_id)
    _audit(session, user_id, "pricing.llm_apply", "estimate_line_item", line_item_id, details=f"applied={bounded}")
    return line_item_to_dict(li)


def activity_report(session: Session, user_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    total_estimates = session.execute(select(func.count()).select_from(Estimate).where(Estimate.user_id == user_id)).scalar_one()
    total_line_items = session.execute(
        select(func.count()).select_from(EstimateLineItem).join(Estimate, EstimateLineItem.estimate_id == Estimate.id).where(Estimate.user_id == user_id)
    ).scalar_one()
    total_billing_events = session.execute(select(func.count()).select_from(BillingEvent).where(BillingEvent.user_id == user_id)).scalar_one()
    total_audits = session.execute(select(func.count()).select_from(AuditEvent).where(AuditEvent.user_id == user_id)).scalar_one()

    return {
        "estimates": int(total_estimates or 0),
        "line_items": int(total_line_items or 0),
        "billing_events": int(total_billing_events or 0),
        "audit_events": int(total_audits or 0),
    }


def export_user_backup(session: Session, user_id: str) -> dict[str, object]:
    _require_user(session, user_id)
    estimates = session.execute(select(Estimate).where(Estimate.user_id == user_id).order_by(Estimate.created_at.asc())).scalars().all()
    return {
        "version": 1,
        "user_id": user_id,
        "generated_at": _now_iso(),
        "estimates": [estimate_to_dict(x, include_lines=True) for x in estimates],
    }


def restore_user_backup(session: Session, user_id: str, payload: dict[str, object]) -> dict[str, int]:
    _require_user(session, user_id)
    restored = 0
    restored_lines = 0
    for estimate_data in payload.get("estimates", []):
        est = Estimate(
            id=_uid(),
            user_id=user_id,
            title=str(estimate_data.get("title", "Restored Estimate")),
            customer_name=str(estimate_data.get("customer_name", "")),
            customer_email=str(estimate_data.get("customer_email", "")),
            customer_phone=str(estimate_data.get("customer_phone", "")),
            job_address=str(estimate_data.get("job_address", "")),
            status="draft",
            estimate_markup_pct=d(estimate_data.get("estimate_markup_pct", 0)),
            tax_rate_pct=d(estimate_data.get("tax_rate_pct", 0)),
            subtotal=Decimal("0"),
            tax=Decimal("0"),
            total=Decimal("0"),
        )
        session.add(est)
        session.flush()
        restored += 1

        line_items = estimate_data.get("line_items", [])
        for idx, line in enumerate(line_items):
            session.add(
                EstimateLineItem(
                    id=_uid(),
                    estimate_id=est.id,
                    sort_order=idx,
                    group_name=str(line.get("group_name", "General")),
                    item_name=str(line.get("item_name", "Unnamed Item")),
                    quantity=d(line.get("quantity", 1)),
                    unit_price=d(line.get("unit_price", 0)),
                    item_markup_pct=d(line.get("item_markup_pct", 0)),
                    discount_value=d(line.get("discount_value", 0)),
                    discount_is_percent=bool(line.get("discount_is_percent", False)),
                    labor_hours=d(line.get("labor_hours", 0)),
                    labor_rate=d(line.get("labor_rate", 0)),
                    total_price=Decimal("0"),
                )
            )
            restored_lines += 1

        recalc_estimate(session, user_id, est.id)

    _audit(session, user_id, "db.restore", "backup", "bulk", details=f"restored={restored}; lines={restored_lines}")
    return {"estimates_restored": restored, "line_items_restored": restored_lines}


def prune_audit_events(
    session: Session,
    retention_days: int | None = None,
    *,
    dry_run: bool = False,
) -> dict[str, object]:
    settings = get_settings()
    days = retention_days if retention_days is not None else settings.audit_retention_days
    if days < 1:
        raise ValueError("retention_days must be at least 1.")
    with operation_lock("admin-audit-prune", settings.data_dir, settings.operation_lock_timeout_seconds):
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        if dry_run:
            deleted = session.execute(
                select(func.count()).select_from(AuditEvent).where(AuditEvent.created_at < cutoff)
            ).scalar_one()
        else:
            deleted = (
                session.query(AuditEvent)
                .where(AuditEvent.created_at < cutoff)
                .delete(synchronize_session=False)
            )
        return {
            "status": "ok",
            "deleted": int(deleted),
            "retention_days": int(days),
            "cutoff_utc": cutoff.isoformat(),
            "dry_run": dry_run,
        }
