from __future__ import annotations

from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field
from pydantic import ConfigDict


class StrictRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class HealthResponse(BaseModel):
    status: str
    db: str


class AuthResponse(BaseModel):
    user_id: str
    email: str
    role: str
    session_token: str


class ProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    labor_rate: str
    default_item_markup_pct: str
    default_estimate_markup_pct: str
    tax_rate_pct: str


class AdminSummaryResponse(BaseModel):
    users: int
    estimates: int
    line_items: int
    billing_events: int
    billing_total_amount: str
    catalog_nodes: int
    catalog_items: int


class AdminUserResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    created_at: str
    estimates_count: int
    billing_events_count: int
    audit_events_count: int
    last_login_at: str | None = None
    last_activity_at: str | None = None


class AdminActivityResponse(BaseModel):
    id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    created_at: str


class AdminBillingLedgerResponse(BaseModel):
    id: str
    user_id: str
    event_type: str
    amount: str
    currency: str
    details: str
    created_at: str


class AdminDemoResetResponse(BaseModel):
    status: str
    seeded: dict[str, int]


class AdminAuditPruneResponse(BaseModel):
    status: str
    deleted: int
    retention_days: int
    cutoff_utc: str
    dry_run: bool


class LlmStatusResponse(BaseModel):
    provider: str
    model: str
    api_key_configured: bool
    live_mode: str
    timeout_seconds: float
    max_retries: int
    max_price_change_pct: str
    simulation_available: bool
    ready_for_live: bool
    blocker_reason: str | None = None


class LlmSuggestionResponse(BaseModel):
    item_name: str
    current_unit_price: str
    suggested_unit_price: str
    confidence: str
    rationale: str
    provider: str
    model: str
    mode: str


class RegisterRequest(StrictRequestModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)


class LoginRequest(StrictRequestModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class ProfileUpdateRequest(StrictRequestModel):
    full_name: str | None = None
    labor_rate: Decimal | None = None
    item_markup_pct: Decimal | None = None
    estimate_markup_pct: Decimal | None = None
    tax_rate_pct: Decimal | None = None


class EstimateCreateRequest(StrictRequestModel):
    title: str
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    job_address: str = ""


class EstimateUpdateRequest(StrictRequestModel):
    title: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    job_address: str | None = None
    estimate_markup_pct: Decimal | None = None
    tax_rate_pct: Decimal | None = None


class EstimateQuickstartRequest(StrictRequestModel):
    catalog_node_name: str = Field(..., min_length=1, max_length=255)
    max_items: int = Field(default=5, ge=1, le=50)


class StatusRequest(StrictRequestModel):
    status: str = Field(..., description="draft|in_progress|completed|locked")


class LineItemCreateRequest(StrictRequestModel):
    item_name: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    item_markup_pct: Decimal | None = None
    labor_hours: Decimal = Decimal("0")
    discount_value: Decimal = Decimal("0")
    discount_is_percent: bool = False
    group_name: str = "General"


class LineItemUpdateRequest(StrictRequestModel):
    quantity: Decimal | None = None
    unit_price: Decimal | None = None
    item_markup_pct: Decimal | None = None
    labor_hours: Decimal | None = None
    discount_value: Decimal | None = None
    discount_is_percent: bool | None = None
    group_name: str | None = None


class ReorderRequest(StrictRequestModel):
    new_index: int


class GroupRequest(StrictRequestModel):
    group_name: str
    line_item_id: str | None = None


class CatalogUpsertRequest(StrictRequestModel):
    name: str
    unit_price: Decimal = Decimal("0")
    labor_hours: Decimal = Decimal("0")
    description: str = ""
    node_id: str | None = None


class CatalogImportRequest(StrictRequestModel):
    items: list[CatalogUpsertRequest]


class TemplateSaveRequest(StrictRequestModel):
    estimate_id: str
    name: str


class TemplateApplyRequest(StrictRequestModel):
    template_id: str
    estimate_id: str


class LlmSuggestRequest(StrictRequestModel):
    item_name: str
    current_unit_price: Decimal
    context: str = ""


class LlmApplyRequest(StrictRequestModel):
    estimate_id: str
    line_item_id: str
    suggested_price: Decimal


class BillingRequest(StrictRequestModel):
    amount: Decimal
    details: str = ""
    idempotency_key: str | None = None


class BillingSubscriptionRequest(StrictRequestModel):
    amount: Decimal | None = None
    details: str = ""
    idempotency_key: str | None = None


class EstimateChargeRequest(StrictRequestModel):
    estimate_id: str
    amount: Decimal | None = None
    details: str = ""
    idempotency_key: str | None = None


class BillingSimulationEventRequest(StrictRequestModel):
    event_type: str
    amount: Decimal | None = None
    details: str = ""
    idempotency_key: str | None = None


class BillingPolicyResponse(BaseModel):
    mode: str
    annual_subscription_amount: str
    realtime_pricing_amount: str
    currency: str


class BillingSubscriptionStateResponse(BaseModel):
    subscription_id: str | None = None
    status: str
    active: bool
    canceled: bool
    past_due: bool
    last_event_type: str | None = None
    last_event_amount: str | None = None
    last_event_at: str | None = None
    annual_subscription_amount: str
    realtime_pricing_amount: str
    currency: str


class BillingProviderStatusResponse(BaseModel):
    provider: str
    live_mode: str
    adapter_ready: bool
    ready_for_live: bool
    stripe_key_configured: bool
    stripe_webhook_secret_configured: bool
    blocker_reason: str | None = None


class ExportRequest(StrictRequestModel):
    output_path: str


class BackupRestoreRequest(StrictRequestModel):
    payload: dict[str, Any]
