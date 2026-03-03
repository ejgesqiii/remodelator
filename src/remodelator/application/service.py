from __future__ import annotations

import hashlib
import io
import json
import secrets
from html import escape
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from uuid import uuid4

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
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
    PasswordResetToken,
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


def _normalize_whole_quantity(quantity: Decimal) -> Decimal:
    q = d(quantity)
    if q % Decimal("1") != 0:
        raise ValueError("Quantity must be a whole number.")
    return q


LABOR_TRADES = {"remodeler", "plumber", "tinner", "electrician", "designer"}
PASSWORD_RESET_TTL_MINUTES = 60


def _normalize_labor_trade(labor_trade: str | None) -> str:
    trade = (labor_trade or "remodeler").strip().lower()
    if trade not in LABOR_TRADES:
        raise ValueError(f"Unsupported labor trade `{trade}`.")
    return trade


def _normalize_labor_hours(value: Decimal | None, field_name: str) -> Decimal:
    if value is None:
        return Decimal("0")
    normalized = d(value)
    if normalized < Decimal("0"):
        raise ValueError(f"{field_name} must be 0 or greater.")
    return normalized


def _positive_rate(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    normalized = d(value)
    if normalized <= Decimal("0"):
        return None
    return normalized


def _default_labor_rate_for_estimate(est: Estimate, user: User | None = None) -> Decimal:
    estimate_default = _positive_rate(est.remodeler_labor_rate)
    if estimate_default is not None:
        return estimate_default
    if user is not None:
        user_trade_default = _positive_rate(getattr(user, "remodeler_labor_rate", None))
        if user_trade_default is not None:
            return user_trade_default
        user_fallback = _positive_rate(getattr(user, "labor_rate", None))
        if user_fallback is not None:
            return user_fallback
    return Decimal("0")


def _user_trade_rate_or_default(user: User, trade: str) -> Decimal:
    trade_rate = _positive_rate(getattr(user, f"{trade}_labor_rate", None))
    if trade_rate is not None:
        return trade_rate
    fallback = _positive_rate(user.labor_rate)
    if fallback is not None:
        return fallback
    return Decimal("0")


def _estimate_labor_rate_by_trade(est: Estimate, labor_trade: str, default_rate: Decimal | None = None) -> Decimal:
    selected: Decimal
    if labor_trade == "plumber":
        selected = d(est.plumber_labor_rate)
    elif labor_trade == "tinner":
        selected = d(est.tinner_labor_rate)
    elif labor_trade == "electrician":
        selected = d(est.electrician_labor_rate)
    elif labor_trade == "designer":
        selected = d(est.designer_labor_rate)
    else:
        selected = d(est.remodeler_labor_rate)

    selected_positive = _positive_rate(selected)
    if selected_positive is not None:
        return selected_positive
    if default_rate is not None:
        default_positive = _positive_rate(default_rate)
        if default_positive is not None:
            return default_positive
    fallback_estimate_default = _positive_rate(est.remodeler_labor_rate)
    if fallback_estimate_default is not None:
        return fallback_estimate_default
    return Decimal("0")


def _trade_hours_from_line(line: EstimateLineItem) -> dict[str, Decimal]:
    hours = {
        "remodeler": _normalize_labor_hours(getattr(line, "remodeler_labor_hours", Decimal("0")), "remodeler_labor_hours"),
        "plumber": _normalize_labor_hours(getattr(line, "plumber_labor_hours", Decimal("0")), "plumber_labor_hours"),
        "tinner": _normalize_labor_hours(getattr(line, "tinner_labor_hours", Decimal("0")), "tinner_labor_hours"),
        "electrician": _normalize_labor_hours(getattr(line, "electrician_labor_hours", Decimal("0")), "electrician_labor_hours"),
        "designer": _normalize_labor_hours(getattr(line, "designer_labor_hours", Decimal("0")), "designer_labor_hours"),
    }
    if sum(hours.values(), Decimal("0")) == Decimal("0"):
        legacy_hours = _normalize_labor_hours(getattr(line, "labor_hours", Decimal("0")), "labor_hours")
        if legacy_hours > Decimal("0"):
            hours[_normalize_labor_trade(getattr(line, "labor_trade", "remodeler"))] = legacy_hours
    return hours


def _trade_hours_from_payload(
    *,
    labor_hours: Decimal | None,
    labor_trade: str | None,
    remodeler_labor_hours: Decimal | None,
    plumber_labor_hours: Decimal | None,
    tinner_labor_hours: Decimal | None,
    electrician_labor_hours: Decimal | None,
    designer_labor_hours: Decimal | None,
) -> dict[str, Decimal]:
    explicit_hours = {
        "remodeler": remodeler_labor_hours,
        "plumber": plumber_labor_hours,
        "tinner": tinner_labor_hours,
        "electrician": electrician_labor_hours,
        "designer": designer_labor_hours,
    }
    if any(value is not None for value in explicit_hours.values()):
        return {
            trade: _normalize_labor_hours(value, f"{trade}_labor_hours")
            for trade, value in explicit_hours.items()
        }

    target_trade = _normalize_labor_trade(labor_trade)
    legacy_hours = _normalize_labor_hours(labor_hours, "labor_hours")
    return {
        "remodeler": legacy_hours if target_trade == "remodeler" else Decimal("0"),
        "plumber": legacy_hours if target_trade == "plumber" else Decimal("0"),
        "tinner": legacy_hours if target_trade == "tinner" else Decimal("0"),
        "electrician": legacy_hours if target_trade == "electrician" else Decimal("0"),
        "designer": legacy_hours if target_trade == "designer" else Decimal("0"),
    }


def _apply_trade_hours(line: EstimateLineItem, hours_by_trade: dict[str, Decimal]) -> None:
    line.remodeler_labor_hours = _normalize_labor_hours(hours_by_trade.get("remodeler"), "remodeler_labor_hours")
    line.plumber_labor_hours = _normalize_labor_hours(hours_by_trade.get("plumber"), "plumber_labor_hours")
    line.tinner_labor_hours = _normalize_labor_hours(hours_by_trade.get("tinner"), "tinner_labor_hours")
    line.electrician_labor_hours = _normalize_labor_hours(hours_by_trade.get("electrician"), "electrician_labor_hours")
    line.designer_labor_hours = _normalize_labor_hours(hours_by_trade.get("designer"), "designer_labor_hours")
    line.labor_hours = (
        line.remodeler_labor_hours
        + line.plumber_labor_hours
        + line.tinner_labor_hours
        + line.electrician_labor_hours
        + line.designer_labor_hours
    )


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
        remodeler_labor_rate=Decimal("75.00"),
        plumber_labor_rate=Decimal("75.00"),
        tinner_labor_rate=Decimal("75.00"),
        electrician_labor_rate=Decimal("75.00"),
        designer_labor_rate=Decimal("75.00"),
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


def request_password_reset(session: Session, email: str) -> dict[str, str | None]:
    email_clean = email.strip().lower()
    user = session.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    payload: dict[str, str | None] = {
        "message": "If an account exists for that email, a reset link has been generated.",
        "reset_token": None,
        "reset_path": None,
    }
    if not user:
        return payload

    now = datetime.now(timezone.utc)
    active_tokens = session.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    ).scalars().all()
    for row in active_tokens:
        row.used_at = now

    raw_token = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    reset_row = PasswordResetToken(
        id=_uid(),
        user_id=user.id,
        token_hash=hashed,
        expires_at=now + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES),
    )
    session.add(reset_row)
    _audit(session, user.id, "password.reset.request", "user", user.id)

    if get_settings().app_env in {"local", "dev", "development", "test"}:
        payload["reset_token"] = raw_token
        payload["reset_path"] = f"/reset-password?token={raw_token}"
    return payload


def reset_password_with_token(session: Session, token: str, new_password: str) -> dict[str, str]:
    raw = token.strip()
    if not raw:
        raise ValueError("Reset token is required.")
    password_clean = _normalize_password(new_password)
    hashed = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    row = session.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hashed,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    ).scalar_one_or_none()
    if not row:
        raise ValueError("Reset token is invalid or expired.")

    user = session.get(User, row.user_id)
    if not user:
        raise ValueError("Reset token is invalid or expired.")

    user.password_hash = _hash_password(password_clean)
    row.used_at = now

    other_tokens = session.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.id != row.id,
        )
    ).scalars().all()
    for other in other_tokens:
        other.used_at = now

    _audit(session, user.id, "password.reset.complete", "user", user.id)
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
        "remodeler_labor_rate": str(user.remodeler_labor_rate),
        "plumber_labor_rate": str(user.plumber_labor_rate),
        "tinner_labor_rate": str(user.tinner_labor_rate),
        "electrician_labor_rate": str(user.electrician_labor_rate),
        "designer_labor_rate": str(user.designer_labor_rate),
        "default_item_markup_pct": str(user.default_item_markup_pct),
        "default_estimate_markup_pct": str(user.default_estimate_markup_pct),
        "tax_rate_pct": str(user.tax_rate_pct),
    }


def update_profile(
    session: Session,
    user_id: str,
    full_name: str | None,
    labor_rate: Decimal | None,
    remodeler_labor_rate: Decimal | None,
    plumber_labor_rate: Decimal | None,
    tinner_labor_rate: Decimal | None,
    electrician_labor_rate: Decimal | None,
    designer_labor_rate: Decimal | None,
    item_markup_pct: Decimal | None,
    estimate_markup_pct: Decimal | None,
    tax_rate_pct: Decimal | None,
) -> dict[str, object]:
    user = _require_user(session, user_id)

    if full_name is not None:
        user.full_name = full_name
    if labor_rate is not None:
        user.labor_rate = labor_rate
        # Backward compatibility: older clients only update one labor rate.
        if remodeler_labor_rate is None:
            user.remodeler_labor_rate = labor_rate
        if plumber_labor_rate is None:
            user.plumber_labor_rate = labor_rate
        if tinner_labor_rate is None:
            user.tinner_labor_rate = labor_rate
        if electrician_labor_rate is None:
            user.electrician_labor_rate = labor_rate
        if designer_labor_rate is None:
            user.designer_labor_rate = labor_rate
    if remodeler_labor_rate is not None:
        user.remodeler_labor_rate = remodeler_labor_rate
    if plumber_labor_rate is not None:
        user.plumber_labor_rate = plumber_labor_rate
    if tinner_labor_rate is not None:
        user.tinner_labor_rate = tinner_labor_rate
    if electrician_labor_rate is not None:
        user.electrician_labor_rate = electrician_labor_rate
    if designer_labor_rate is not None:
        user.designer_labor_rate = designer_labor_rate
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
        remodeler_labor_rate=_user_trade_rate_or_default(user, "remodeler"),
        plumber_labor_rate=_user_trade_rate_or_default(user, "plumber"),
        tinner_labor_rate=_user_trade_rate_or_default(user, "tinner"),
        electrician_labor_rate=_user_trade_rate_or_default(user, "electrician"),
        designer_labor_rate=_user_trade_rate_or_default(user, "designer"),
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
        item_trade = _normalize_labor_trade(getattr(item, "labor_trade", "remodeler"))
        item_labor_hours = d(item.labor_hours)
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
                labor_hours=item_labor_hours,
                remodeler_labor_hours=item_labor_hours if item_trade == "remodeler" else Decimal("0"),
                plumber_labor_hours=item_labor_hours if item_trade == "plumber" else Decimal("0"),
                tinner_labor_hours=item_labor_hours if item_trade == "tinner" else Decimal("0"),
                electrician_labor_hours=item_labor_hours if item_trade == "electrician" else Decimal("0"),
                designer_labor_hours=item_labor_hours if item_trade == "designer" else Decimal("0"),
                labor_trade=item_trade,
                labor_rate=_estimate_labor_rate_by_trade(est, item_trade),
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
    remodeler_labor_rate: Decimal | None,
    plumber_labor_rate: Decimal | None,
    tinner_labor_rate: Decimal | None,
    electrician_labor_rate: Decimal | None,
    designer_labor_rate: Decimal | None,
) -> dict[str, object]:
    user = _require_user(session, user_id)
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
    if remodeler_labor_rate is not None:
        est.remodeler_labor_rate = remodeler_labor_rate
    if plumber_labor_rate is not None:
        est.plumber_labor_rate = plumber_labor_rate
    if tinner_labor_rate is not None:
        est.tinner_labor_rate = tinner_labor_rate
    if electrician_labor_rate is not None:
        est.electrician_labor_rate = electrician_labor_rate
    if designer_labor_rate is not None:
        est.designer_labor_rate = designer_labor_rate

    default_labor_rate = _default_labor_rate_for_estimate(est, user)
    if _positive_rate(est.remodeler_labor_rate) is None:
        est.remodeler_labor_rate = default_labor_rate
    if _positive_rate(est.plumber_labor_rate) is None:
        est.plumber_labor_rate = default_labor_rate
    if _positive_rate(est.tinner_labor_rate) is None:
        est.tinner_labor_rate = default_labor_rate
    if _positive_rate(est.electrician_labor_rate) is None:
        est.electrician_labor_rate = default_labor_rate
    if _positive_rate(est.designer_labor_rate) is None:
        est.designer_labor_rate = default_labor_rate
    for li in session.execute(_line_select(estimate_id)).scalars().all():
        li.labor_rate = _estimate_labor_rate_by_trade(
            est,
            _normalize_labor_trade(getattr(li, "labor_trade", "remodeler")),
            default_labor_rate,
        )

    est.version += 1
    recalc_estimate(session, user_id, est.id)
    _audit(session, user_id, "estimate.update", "estimate", est.id)
    return estimate_to_dict(est)


def delete_estimate(session: Session, user_id: str, estimate_id: str) -> dict[str, str]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")

    session.delete(est)
    _audit(session, user_id, "estimate.delete", "estimate", estimate_id)
    return {"status": "deleted", "estimate_id": estimate_id}


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
    labor_trade: str | None = None,
    remodeler_labor_hours: Decimal | None = None,
    plumber_labor_hours: Decimal | None = None,
    tinner_labor_hours: Decimal | None = None,
    electrician_labor_hours: Decimal | None = None,
    designer_labor_hours: Decimal | None = None,
) -> dict[str, object]:
    user = _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user.id:
        raise ValueError("Estimate not found.")
    if est.status == "locked":
        raise ValueError("Estimate is locked.")

    existing_count = session.execute(select(func.count()).select_from(EstimateLineItem).where(EstimateLineItem.estimate_id == estimate_id)).scalar_one()
    markup = item_markup_pct if item_markup_pct is not None else d(user.default_item_markup_pct)

    normalized_quantity = _normalize_whole_quantity(quantity)
    normalized_labor_trade = _normalize_labor_trade(labor_trade)
    trade_hours = _trade_hours_from_payload(
        labor_hours=labor_hours,
        labor_trade=normalized_labor_trade,
        remodeler_labor_hours=remodeler_labor_hours,
        plumber_labor_hours=plumber_labor_hours,
        tinner_labor_hours=tinner_labor_hours,
        electrician_labor_hours=electrician_labor_hours,
        designer_labor_hours=designer_labor_hours,
    )

    li = EstimateLineItem(
        id=_uid(),
        estimate_id=estimate_id,
        sort_order=int(existing_count),
        group_name=group_name,
        item_name=item_name,
        quantity=normalized_quantity,
        unit_price=unit_price,
        item_markup_pct=markup,
        labor_trade=normalized_labor_trade,
        labor_rate=_estimate_labor_rate_by_trade(est, normalized_labor_trade),
        discount_value=discount_value,
        discount_is_percent=discount_is_percent,
        total_price=Decimal("0"),
    )
    _apply_trade_hours(li, trade_hours)
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
    labor_trade: str | None,
    remodeler_labor_hours: Decimal | None = None,
    plumber_labor_hours: Decimal | None = None,
    tinner_labor_hours: Decimal | None = None,
    electrician_labor_hours: Decimal | None = None,
    designer_labor_hours: Decimal | None = None,
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
        li.quantity = _normalize_whole_quantity(quantity)
    if unit_price is not None:
        li.unit_price = unit_price
    if item_markup_pct is not None:
        li.item_markup_pct = item_markup_pct
    current_trade_hours = _trade_hours_from_line(li)
    has_explicit_trade_hours = any(
        value is not None
        for value in (
            remodeler_labor_hours,
            plumber_labor_hours,
            tinner_labor_hours,
            electrician_labor_hours,
            designer_labor_hours,
        )
    )
    normalized_trade = _normalize_labor_trade(labor_trade or getattr(li, "labor_trade", "remodeler"))
    if has_explicit_trade_hours:
        if remodeler_labor_hours is not None:
            current_trade_hours["remodeler"] = _normalize_labor_hours(remodeler_labor_hours, "remodeler_labor_hours")
        if plumber_labor_hours is not None:
            current_trade_hours["plumber"] = _normalize_labor_hours(plumber_labor_hours, "plumber_labor_hours")
        if tinner_labor_hours is not None:
            current_trade_hours["tinner"] = _normalize_labor_hours(tinner_labor_hours, "tinner_labor_hours")
        if electrician_labor_hours is not None:
            current_trade_hours["electrician"] = _normalize_labor_hours(electrician_labor_hours, "electrician_labor_hours")
        if designer_labor_hours is not None:
            current_trade_hours["designer"] = _normalize_labor_hours(designer_labor_hours, "designer_labor_hours")
    elif labor_hours is not None:
        normalized_hours = _normalize_labor_hours(labor_hours, "labor_hours")
        current_trade_hours = {trade: Decimal("0") for trade in LABOR_TRADES}
        current_trade_hours[normalized_trade] = normalized_hours
    elif labor_trade is not None:
        total_hours = sum(current_trade_hours.values(), Decimal("0"))
        current_trade_hours = {trade: Decimal("0") for trade in LABOR_TRADES}
        current_trade_hours[normalized_trade] = total_hours
    if discount_value is not None:
        li.discount_value = discount_value
    if discount_is_percent is not None:
        li.discount_is_percent = discount_is_percent
    if group_name is not None:
        li.group_name = group_name
    li.labor_trade = normalized_trade
    _apply_trade_hours(li, current_trade_hours)
    li.labor_rate = _estimate_labor_rate_by_trade(est, normalized_trade)

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


def reorder_line_item_by_direction(
    session: Session,
    user_id: str,
    estimate_id: str,
    line_item_id: str,
    direction: int,
) -> dict[str, object]:
    if direction not in {-1, 1}:
        raise ValueError("direction must be -1 or 1.")

    lines = session.execute(_line_select(estimate_id)).scalars().all()
    current_idx = next((idx for idx, line in enumerate(lines) if line.id == line_item_id), None)
    if current_idx is None:
        raise ValueError("Line item not found.")

    return reorder_line_item(session, user_id, estimate_id, line_item_id, current_idx + direction)


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
    user = _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    # Session autoflush is disabled globally, so flush pending mutations before pricing queries.
    session.flush()

    subtotal = Decimal("0")
    total_tax = Decimal("0")
    total = Decimal("0")

    default_labor_rate = _default_labor_rate_for_estimate(est, user)
    if _positive_rate(est.remodeler_labor_rate) is None:
        est.remodeler_labor_rate = default_labor_rate
    if _positive_rate(est.plumber_labor_rate) is None:
        est.plumber_labor_rate = default_labor_rate
    if _positive_rate(est.tinner_labor_rate) is None:
        est.tinner_labor_rate = default_labor_rate
    if _positive_rate(est.electrician_labor_rate) is None:
        est.electrician_labor_rate = default_labor_rate
    if _positive_rate(est.designer_labor_rate) is None:
        est.designer_labor_rate = default_labor_rate
    for li in session.execute(_line_select(estimate_id)).scalars().all():
        trade_hours = _trade_hours_from_line(li)
        _apply_trade_hours(li, trade_hours)
        labor_trade = _normalize_labor_trade(getattr(li, "labor_trade", "remodeler"))
        if trade_hours.get(labor_trade, Decimal("0")) <= Decimal("0"):
            labor_trade = next((trade for trade, hours in trade_hours.items() if hours > Decimal("0")), "remodeler")
            li.labor_trade = labor_trade

        labor_amount = Decimal("0")
        for trade, hours in trade_hours.items():
            if hours <= Decimal("0"):
                continue
            labor_amount += hours * _estimate_labor_rate_by_trade(est, trade, default_labor_rate)

        total_labor_hours = sum(trade_hours.values(), Decimal("0"))
        if total_labor_hours > Decimal("0"):
            li.labor_rate = labor_amount / total_labor_hours
        else:
            li.labor_rate = _estimate_labor_rate_by_trade(est, labor_trade, default_labor_rate)
        calc = calculate_line_total(
            PricingInput(
                quantity=d(li.quantity),
                unit_price=d(li.unit_price),
                item_markup_pct=d(li.item_markup_pct),
                estimate_markup_pct=d(est.estimate_markup_pct),
                discount_value=d(li.discount_value),
                discount_is_percent=bool(li.discount_is_percent),
                tax_rate_pct=d(est.tax_rate_pct),
                labor_hours=total_labor_hours,
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
        remodeler_labor_rate=source.remodeler_labor_rate,
        plumber_labor_rate=source.plumber_labor_rate,
        tinner_labor_rate=source.tinner_labor_rate,
        electrician_labor_rate=source.electrician_labor_rate,
        designer_labor_rate=source.designer_labor_rate,
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
                remodeler_labor_hours=getattr(line, "remodeler_labor_hours", Decimal("0")),
                plumber_labor_hours=getattr(line, "plumber_labor_hours", Decimal("0")),
                tinner_labor_hours=getattr(line, "tinner_labor_hours", Decimal("0")),
                electrician_labor_hours=getattr(line, "electrician_labor_hours", Decimal("0")),
                designer_labor_hours=getattr(line, "designer_labor_hours", Decimal("0")),
                labor_trade=getattr(line, "labor_trade", "remodeler"),
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


def export_estimate_json(session: Session, user_id: str, estimate_id: str, output_path: Path | None = None) -> dict[str, str]:
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
        line_trade = _normalize_labor_trade(getattr(line, "labor_trade", "remodeler"))
        line_hours = d(line.labor_hours)
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
                labor_hours=line_hours,
                remodeler_labor_hours=line_hours if line_trade == "remodeler" else Decimal("0"),
                plumber_labor_hours=line_hours if line_trade == "plumber" else Decimal("0"),
                tinner_labor_hours=line_hours if line_trade == "tinner" else Decimal("0"),
                electrician_labor_hours=line_hours if line_trade == "electrician" else Decimal("0"),
                designer_labor_hours=line_hours if line_trade == "designer" else Decimal("0"),
                labor_trade=line_trade,
                labor_rate=_estimate_labor_rate_by_trade(est, line_trade),
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
    labor_trade: str,
    description: str,
    node_id: str | None = None,
) -> dict[str, str]:
    _require_user(session, user_id)
    require_admin_user_access(session, user_id)
    clean_name = name.strip()
    if not clean_name:
        raise ValueError("Catalog item name is required.")
    normalized_labor_trade = _normalize_labor_trade(labor_trade)

    item = session.execute(select(CatalogItem).where(CatalogItem.name == clean_name)).scalar_one_or_none()
    if item is None:
        item = CatalogItem(
            id=_uid(),
            node_id=node_id,
            name=clean_name,
            unit_price=unit_price,
            labor_hours=labor_hours,
            labor_trade=normalized_labor_trade,
            description=description,
        )
        session.add(item)
        action = "catalog.item.create"
    else:
        item.node_id = node_id
        item.unit_price = unit_price
        item.labor_hours = labor_hours
        item.labor_trade = normalized_labor_trade
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
            "labor_trade": _normalize_labor_trade(getattr(row, "labor_trade", "remodeler")),
        }
        for row in rows
    ]


def import_catalog_json(session: Session, user_id: str, path: Path) -> dict[str, int]:
    payload = json.loads(path.read_text())
    return import_catalog_items(session, user_id, payload.get("items", []))


def import_catalog_items(session: Session, user_id: str, items: list[dict[str, object]]) -> dict[str, int]:
    _require_user(session, user_id)
    require_admin_user_access(session, user_id)
    inserted = 0
    updated = 0

    for item in items:
        result = upsert_catalog_item(
            session=session,
            user_id=user_id,
            name=str(item.get("name", "")),
            unit_price=d(item.get("unit_price", 0)),
            labor_hours=d(item.get("labor_hours", 0)),
            labor_trade=str(item.get("labor_trade", "remodeler")),
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
        by_node.setdefault(key, []).append(
            {
                "id": item.id,
                "name": item.name,
                "unit_price": str(item.unit_price),
                "labor_hours": str(item.labor_hours),
                "labor_trade": _normalize_labor_trade(getattr(item, "labor_trade", "remodeler")),
            }
        )

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


def _proposal_data_from_estimate(est_data: dict[str, object]) -> dict[str, object]:
    line_items = list(est_data.get("line_items", []))
    return {
        "id": str(est_data["id"]),
        "title": str(est_data["title"]),
        "status": str(est_data["status"]),
        "customer_name": str(est_data.get("customer_name", "") or "Client"),
        "customer_email": str(est_data.get("customer_email", "") or "—"),
        "customer_phone": str(est_data.get("customer_phone", "") or "—"),
        "job_address": str(est_data.get("job_address", "") or "—"),
        "estimate_markup_pct": _format_money(d(est_data.get("estimate_markup_pct", 0))).rstrip("0").rstrip("."),
        "tax_rate_pct": _format_money(d(est_data.get("tax_rate_pct", 0))).rstrip("0").rstrip("."),
        "subtotal": _format_money(d(est_data.get("subtotal", 0))),
        "tax": _format_money(d(est_data.get("tax", 0))),
        "total": _format_money(d(est_data.get("total", 0))),
        "line_items": [
            {
                "item_name": str(li.get("item_name", "Item")),
                "quantity": str(li.get("quantity", "0")),
                "unit_price": _format_money(d(li.get("unit_price", 0))),
                "total_price": _format_money(d(li.get("total_price", 0))),
            }
            for li in line_items
        ],
    }


def _render_proposal_html_from_data(data: dict[str, object]) -> str:
    rows = "".join(
        f"""
        <tr>
            <td>{escape(str(item["item_name"]))}</td>
            <td class="num">{escape(str(item["quantity"]))}</td>
            <td class="num">${escape(str(item["unit_price"]))}</td>
            <td class="num strong">${escape(str(item["total_price"]))}</td>
        </tr>
        """
        for item in data["line_items"]
    )
    if not rows:
        rows = '<tr><td colspan="4" class="empty">No line items</td></tr>'

    legacy_disclaimers = """
      <div class="proposal-section terms">
        <h3>General Conditions and Disclaimers</h3>
        <p>The following items are included to describe general conditions and disclaimers for typical construction projects.</p>
        <p>1. This proposal includes all items listed in this proposal, but does not include any items unforeseen or not visible during site inspection (items behind walls, under floors, below grade or otherwise not known at time of inspection).</p>
        <p>2. This proposal includes items listed. The prices include labor and materials and are based on site visit. Prices may change for the following reasons:</p>
        <p class="proposal-subclause">a. Owner changes in scope or selections.</p>
        <p class="proposal-subclause">b. Inspection and permitting process (Historical Society approvals are not included) and scope created by building inspectors.</p>
        <p class="proposal-subclause">c. Unforeseen conditions, not found at the time of proposal inspection.</p>
        <p class="proposal-subclause">d. Raw materials price escalations if past 30 days of proposal.</p>
        <p>3. Any agreed upon additional work will proceed with the signed consent of the owner with a known amount in the form of a change order with 50% of the change order as a deposit, with the balance upon completion. Or, approval based on time and materials may be required if the work involves unknown scope.</p>
        <p>4. If changes in the contract involves money or scope disputes, the work will stop until the dispute is resolved.</p>
        <p>5. Remodeling projects are dusty by nature. Kain Construction LLC will take all necessary precautions to control dust, but is not responsible for migrating dust as part of the work. The owner should cover furniture, computers and other valuable items to avoid dust.</p>
        <p>6. Kain Construction LLC will work with subcontractors recommended by the owner, or self performed work. We cannot, however, commit to schedules or quality of the subcontractors. Self-performed work requires the owner to pull permits and get liability insurance to cover the project.</p>
        <p>7. Items shown on proposal with "allow" are allowances. These numbers are subject to change based on choices, field conditions, and market pricing.</p>
        <p>8. We have liability insurance to cover items over which we have "care, custody and control." We cannot allow children or pets in the work area, as we cannot predict what they will do. This also applies to people not directly involved in the construction process, or non-owners.</p>
        <p>9. When the construction project starts, all items such as jewelry or other valuable items that the owner perceives could be at risk should be stored in a locked area, and not available to construction personnel. Kain Construction will not accept responsibility for stolen items that cannot be proven and prosecuted.</p>
        <p>10. Kain Construction will not assume responsibility for, or insure, people not under contract with the homeowner.</p>
        <p>11. These measures are for the protection of the homeowner, and Kain Construction.</p>
        <p>Understanding the general conditions and disclaimers mentioned above, I agree to have Kain Construction LLC furnish and install the items in this proposal with a one year warranty against materials and workmanship. Normal wear and tear will be repaired at time and materials billing.</p>
      </div>
      <div class="proposal-section">
        <p><strong>Terms:</strong> ________________________________</p>
      </div>
      <div class="proposal-section">
        <p><strong>This proposal submitted by:</strong> ____________________________   <strong>Date:</strong> ____________</p>
      </div>
      <div class="proposal-section">
        <p><strong>This proposal accepted by:</strong> _____________________________   <strong>Date:</strong> ____________</p>
        <p><strong>Name:</strong> _________________________________   <strong>Date:</strong> ____________</p>
      </div>
    """

    return f"""
    <div class="proposal-doc">
      <div class="proposal-head">
        <div>
          <h1>{escape(str(data["title"]))}</h1>
          <p class="sub">Estimate #{escape(str(data["id"]))} · Status: {escape(str(data["status"]).replace("_", " ").title())}</p>
        </div>
      </div>

      <div class="proposal-section two-col">
        <div>
          <h3>Client</h3>
          <p><strong>{escape(str(data["customer_name"]))}</strong></p>
          <p>{escape(str(data["customer_email"]))}</p>
          <p>{escape(str(data["customer_phone"]))}</p>
          <p>{escape(str(data["job_address"]))}</p>
        </div>
        <div>
          <h3>Pricing</h3>
          <p>Markup: {escape(str(data["estimate_markup_pct"]))}%</p>
          <p>Tax Rate: {escape(str(data["tax_rate_pct"]))}%</p>
        </div>
      </div>

      <div class="proposal-section">
        <h3>Scope & Pricing</h3>
        <table class="proposal-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="num">Qty</th>
              <th class="num">Unit Price</th>
              <th class="num">Line Total</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      <div class="proposal-section totals">
        <div class="line"><span>Subtotal</span><strong>${escape(str(data["subtotal"]))}</strong></div>
        <div class="line"><span>Tax</span><strong>${escape(str(data["tax"]))}</strong></div>
        <div class="line grand"><span>Total</span><strong>${escape(str(data["total"]))}</strong></div>
      </div>

      {legacy_disclaimers}
    </div>
    """


def render_proposal_html(session: Session, user_id: str, estimate_id: str) -> str:
    est_data = get_estimate(session, user_id, estimate_id)
    proposal_data = _proposal_data_from_estimate(est_data)
    _audit(session, user_id, "proposal.render", "estimate", estimate_id)
    return _render_proposal_html_from_data(proposal_data)


def _generate_proposal_pdf_bytes(data: dict[str, object]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    story: list[object] = []

    story.append(Paragraph(escape(str(data["title"])), styles["Title"]))
    story.append(Paragraph(
        f'Estimate #{escape(str(data["id"]))} - Status: {escape(str(data["status"]).replace("_", " ").title())}',
        styles["Normal"],
    ))
    story.append(Spacer(1, 12))

    client_table = Table(
        [
            ["Client", "Pricing"],
            [
                f'{data["customer_name"]}\n{data["customer_email"]}\n{data["customer_phone"]}\n{data["job_address"]}',
                f'Markup: {data["estimate_markup_pct"]}%\nTax Rate: {data["tax_rate_pct"]}%',
            ],
        ],
        colWidths=[3.4 * inch, 3.4 * inch],
    )
    client_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3ff")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9e0ec")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5eaf3")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 1), (-1, -1), 13),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 14))

    table_rows = [["Item", "Qty", "Unit Price", "Line Total"]]
    line_items = list(data.get("line_items", []))
    for item in line_items:
        table_rows.append(
            [
                str(item["item_name"]),
                str(item["quantity"]),
                f'${item["unit_price"]}',
                f'${item["total_price"]}',
            ]
        )
    if len(table_rows) == 1:
        table_rows.append(["No line items", "-", "-", "-"])

    line_table = Table(table_rows, colWidths=[3.4 * inch, 0.7 * inch, 1.4 * inch, 1.3 * inch])
    line_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf2f7")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9e0ec")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5eaf3")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 14))

    totals_table = Table(
        [
            ["Subtotal", f'${data["subtotal"]}'],
            ["Tax", f'${data["tax"]}'],
            ["Total", f'${data["total"]}'],
        ],
        colWidths=[5.5 * inch, 1.3 * inch],
    )
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("LINEABOVE", (0, 2), (-1, 2), 0.5, colors.HexColor("#c9d2e3")),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 16))
    story.append(Paragraph("General Conditions and Disclaimers", styles["Heading3"]))
    story.append(Paragraph(
        "The following items are included to describe general conditions and disclaimers for typical construction projects.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "1. This proposal includes all items listed in this proposal, but does not include any items unforeseen or not visible during site inspection (items behind walls, under floors, below grade or otherwise not known at time of inspection).",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "2. This proposal includes items listed. The prices include labor and materials and are based on site visit. Prices may change for the following reasons:",
        styles["Normal"],
    ))
    story.append(Paragraph("a. Owner changes in scope or selections.", styles["Normal"]))
    story.append(Paragraph(
        "b. Inspection and permitting process (Historical Society approvals are not included) and scope created by building inspectors.",
        styles["Normal"],
    ))
    story.append(Paragraph("c. Unforeseen conditions, not found at the time of proposal inspection.", styles["Normal"]))
    story.append(Paragraph("d. Raw materials price escalations if past 30 days of proposal.", styles["Normal"]))
    story.append(Paragraph(
        "3. Any agreed upon additional work will proceed with the signed consent of the owner with a known amount in the form of a change order with 50% of the change order as a deposit, with the balance upon completion. Or, approval based on time and materials may be required if the work involves unknown scope.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "4. If changes in the contract involves money or scope disputes, the work will stop until the dispute is resolved.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "5. Remodeling projects are dusty by nature. Kain Construction LLC will take all necessary precautions to control dust, but is not responsible for migrating dust as part of the work. The owner should cover furniture, computers and other valuable items to avoid dust.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "6. Kain Construction LLC will work with subcontractors recommended by the owner, or self performed work. We cannot, however, commit to schedules or quality of the subcontractors. Self-performed work requires the owner to pull permits and get liability insurance to cover the project.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        '7. Items shown on proposal with "allow" are allowances. These numbers are subject to change based on choices, field conditions, and market pricing.',
        styles["Normal"],
    ))
    story.append(Paragraph(
        '8. We have liability insurance to cover items over which we have "care, custody and control." We cannot allow children or pets in the work area, as we cannot predict what they will do. This also applies to people not directly involved in the construction process, or non-owners.',
        styles["Normal"],
    ))
    story.append(Paragraph(
        "9. When the construction project starts, all items such as jewelry or other valuable items that the owner perceives could be at risk should be stored in a locked area, and not available to construction personnel. Kain Construction will not accept responsibility for stolen items that cannot be proven and prosecuted.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "10. Kain Construction will not assume responsibility for, or insure, people not under contract with the homeowner.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "11. These measures are for the protection of the homeowner, and Kain Construction.",
        styles["Normal"],
    ))
    story.append(Paragraph(
        "Understanding the general conditions and disclaimers mentioned above, I agree to have Kain Construction LLC furnish and install the items in this proposal with a one year warranty against materials and workmanship. Normal wear and tear will be repaired at time and materials billing.",
        styles["Normal"],
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Terms: ________________________________", styles["Normal"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("This proposal submitted by: ____________________________   Date: ____________", styles["Normal"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("This proposal accepted by: _____________________________   Date: ____________", styles["Normal"]))
    story.append(Paragraph("Name: _________________________________   Date: ____________", styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()


def generate_proposal_pdf(session: Session, user_id: str, estimate_id: str, output_path: Path | None = None) -> dict[str, str]:
    est_data = get_estimate(session, user_id, estimate_id)
    proposal_data = _proposal_data_from_estimate(est_data)
    pdf_bytes = _generate_proposal_pdf_bytes(proposal_data)
    output = _resolve_output_path(output_path, f"proposal_{estimate_id}.pdf")
    output.write_bytes(pdf_bytes)

    _audit(session, user_id, "proposal.pdf", "estimate", estimate_id, details=str(output))
    return {"path": str(output)}


def proposal_pdf_bytes(session: Session, user_id: str, estimate_id: str) -> bytes:
    est_data = get_estimate(session, user_id, estimate_id)
    proposal_data = _proposal_data_from_estimate(est_data)
    _audit(session, user_id, "proposal.pdf.bytes", "estimate", estimate_id)
    return _generate_proposal_pdf_bytes(proposal_data)


def create_public_proposal_token(session: Session, user_id: str, estimate_id: str) -> dict[str, str]:
    _require_user(session, user_id)
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Estimate not found.")
    token = _issue_session_token(f"proposal:{estimate_id}:{user_id}")
    _audit(session, user_id, "proposal.share.create", "estimate", estimate_id)
    return {"token": token, "path": f"/proposal/public/{token}"}


def _resolve_public_proposal_token(session: Session, token: str) -> tuple[str, str]:
    principal = resolve_user_id_from_session_token(token)
    if not principal.startswith("proposal:"):
        raise ValueError("Invalid public proposal token.")
    parts = principal.split(":")
    if len(parts) != 3:
        raise ValueError("Invalid public proposal token.")
    _, estimate_id, user_id = parts
    est = session.get(Estimate, estimate_id)
    if not est or est.user_id != user_id:
        raise ValueError("Proposal not found.")
    return estimate_id, user_id


def render_public_proposal_html(session: Session, token: str) -> str:
    estimate_id, user_id = _resolve_public_proposal_token(session, token)
    est_data = get_estimate(session, user_id, estimate_id)
    return _render_proposal_html_from_data(_proposal_data_from_estimate(est_data))


def public_proposal_pdf_bytes(session: Session, token: str) -> bytes:
    estimate_id, user_id = _resolve_public_proposal_token(session, token)
    est_data = get_estimate(session, user_id, estimate_id)
    return _generate_proposal_pdf_bytes(_proposal_data_from_estimate(est_data))


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

    # Session autoflush is disabled globally; flush first so in-transaction writes are visible.
    session.flush()
    candidate_keys = _billing_idempotency_candidate_keys(user_id, idempotency_key)
    existing_key = session.execute(
        select(IdempotencyRecord)
        .where(
            IdempotencyRecord.scope == "billing",
            IdempotencyRecord.user_id == user_id,
            IdempotencyRecord.key.in_(candidate_keys),
        )
        .order_by(IdempotencyRecord.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not existing_key or not existing_key.billing_event_id:
        return None
    return session.get(BillingEvent, existing_key.billing_event_id)


def _billing_idempotency_storage_key(user_id: str, idempotency_key: str) -> str:
    digest = hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()
    return f"billing:{user_id}:{digest}"


def _billing_idempotency_candidate_keys(user_id: str, idempotency_key: str) -> tuple[str, ...]:
    # Keep backward compatibility for records created before per-user hashed storage.
    keys = (
        _billing_idempotency_storage_key(user_id, idempotency_key),
        f"billing:{user_id}:{idempotency_key}",
        idempotency_key,
    )
    deduped_keys: list[str] = []
    seen: set[str] = set()
    for key in keys:
        if key in seen:
            continue
        seen.add(key)
        deduped_keys.append(key)
    return tuple(deduped_keys)


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
    normalized_idempotency_key = idempotency_key.strip() if idempotency_key else None
    if normalized_idempotency_key == "":
        normalized_idempotency_key = None
    storage_idempotency_key = (
        _billing_idempotency_storage_key(user_id, normalized_idempotency_key)
        if normalized_idempotency_key
        else None
    )

    existing_event = _lookup_idempotent_billing_event(session, user_id, normalized_idempotency_key)
    if existing_event:
        return _billing_event_response(
            existing_event,
            idempotency_status="replayed",
            idempotency_key=normalized_idempotency_key,
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

    if storage_idempotency_key:
        session.add(
            IdempotencyRecord(
                id=_uid(),
                key=storage_idempotency_key,
                scope="billing",
                user_id=user_id,
                billing_event_id=event.id,
            )
        )
        # Surface duplicate-idempotency conflicts within this call, not at outer commit.
        session.flush()

    _audit(session, user_id, f"billing.{event_type}", "billing_event", event.id, details=details)
    return _billing_event_response(
        event,
        idempotency_status="created",
        idempotency_key=normalized_idempotency_key,
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
            remodeler_labor_rate=d(estimate_data.get("remodeler_labor_rate", 0)),
            plumber_labor_rate=d(estimate_data.get("plumber_labor_rate", 0)),
            tinner_labor_rate=d(estimate_data.get("tinner_labor_rate", 0)),
            electrician_labor_rate=d(estimate_data.get("electrician_labor_rate", 0)),
            designer_labor_rate=d(estimate_data.get("designer_labor_rate", 0)),
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
                    remodeler_labor_hours=d(line.get("remodeler_labor_hours", 0)),
                    plumber_labor_hours=d(line.get("plumber_labor_hours", 0)),
                    tinner_labor_hours=d(line.get("tinner_labor_hours", 0)),
                    electrician_labor_hours=d(line.get("electrician_labor_hours", 0)),
                    designer_labor_hours=d(line.get("designer_labor_hours", 0)),
                    labor_trade=_normalize_labor_trade(str(line.get("labor_trade", "remodeler"))),
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
