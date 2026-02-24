from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from remodelator.infra.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    labor_rate: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    default_item_markup_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    default_estimate_markup_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    tax_rate_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    estimates: Mapped[list[Estimate]] = relationship(back_populates="user", cascade="all, delete-orphan")


class CatalogNode(Base):
    __tablename__ = "catalog_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    parent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("catalog_nodes.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    node_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("catalog_nodes.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    labor_hours: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Estimate(Base):
    __tablename__ = "estimates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    customer_name: Mapped[str] = mapped_column(String(255), default="")
    customer_email: Mapped[str] = mapped_column(String(255), default="")
    customer_phone: Mapped[str] = mapped_column(String(64), default="")
    job_address: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    estimate_markup_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    tax_rate_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    tax: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="estimates")
    line_items: Mapped[list[EstimateLineItem]] = relationship(back_populates="estimate", cascade="all, delete-orphan")


class EstimateLineItem(Base):
    __tablename__ = "estimate_line_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estimate_id: Mapped[str] = mapped_column(String(36), ForeignKey("estimates.id"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    group_name: Mapped[str] = mapped_column(String(255), default="General")
    item_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("1"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    item_markup_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    discount_is_percent: Mapped[bool] = mapped_column(Boolean, default=False)
    labor_hours: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    labor_rate: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))

    estimate: Mapped[Estimate] = relationship(back_populates="line_items")


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class TemplateLineItem(Base):
    __tablename__ = "template_line_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("templates.id"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    group_name: Mapped[str] = mapped_column(String(255), default="General")
    item_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("1"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    item_markup_pct: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"))
    labor_hours: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))


class BillingEvent(Base):
    __tablename__ = "billing_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    scope: Mapped[str] = mapped_column(String(64), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    billing_event_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("billing_events.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
