// ─── Auth ───
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { email: string; password: string; full_name: string };
export type AuthResponse = { user_id: string; email: string; role: string; session_token: string };

// ─── Profile ───
export type UserProfile = {
    id: string;
    email: string;
    role: string;
    full_name: string;
    labor_rate: string;
    default_item_markup_pct: string;
    default_estimate_markup_pct: string;
    tax_rate_pct: string;
};
export type UpdateProfileRequest = {
    full_name?: string;
    labor_rate?: number;
    item_markup_pct?: number;
    estimate_markup_pct?: number;
    tax_rate_pct?: number;
};

// ─── Estimates ───
export type Estimate = {
    id: string;
    title: string;
    status: string;
    version: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    job_address: string;
    estimate_markup_pct: string;
    tax_rate_pct: string;
    subtotal: string;
    tax: string;
    total: string;
    updated_at?: string;
    created_at?: string;
    line_items?: LineItem[];
};

export type CreateEstimateRequest = {
    title: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    job_address?: string;
};

export type UpdateEstimateRequest = {
    title?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    job_address?: string;
    estimate_markup_pct?: number;
    tax_rate_pct?: number;
};

// ─── Line Items ───
export type LineItem = {
    id: string;
    estimate_id: string;
    sort_order: number;
    group_name: string;
    item_name: string;
    quantity: string;
    unit_price: string;
    item_markup_pct: string;
    discount_value: string;
    discount_is_percent: boolean;
    labor_hours: string;
    labor_rate: string;
    total_price: string;
};

export type AddLineItemRequest = {
    item_name: string;
    quantity: number;
    unit_price: number;
    item_markup_pct?: number;
    labor_hours?: number;
    discount_value?: number;
    discount_is_percent?: boolean;
    group_name?: string;
};

export type UpdateLineItemRequest = {
    quantity?: number;
    unit_price?: number;
    item_markup_pct?: number;
    labor_hours?: number;
    discount_value?: number;
    discount_is_percent?: boolean;
    group_name?: string;
};

// ─── Catalog ───
export type CatalogTreeNode = {
    node_id: string | null;
    name: string;
    items: Array<{ id: string; name: string }>;
};

export type CatalogItem = {
    id: string;
    name: string;
    unit_price: string;
    labor_hours: string;
};

// ─── Templates ───
export type TemplateSummary = {
    id: string;
    name: string;
    line_item_count: number;
    created_at: string;
};

// ─── Billing ───
export type BillingPolicy = {
    mode: string;
    annual_subscription_amount: string;
    realtime_pricing_amount: string;
    currency: string;
};

export type BillingProviderStatus = {
    provider: string;
    live_mode: string;
    adapter_ready: boolean;
    ready_for_live: boolean;
    stripe_key_configured: boolean;
    stripe_webhook_secret_configured: boolean;
    blocker_reason?: string | null;
};

export type BillingSubscriptionState = {
    subscription_id?: string | null;
    status: string;
    active: boolean;
    canceled: boolean;
    past_due: boolean;
    last_event_type?: string | null;
    last_event_amount?: string | null;
    last_event_at?: string | null;
    annual_subscription_amount: string;
    realtime_pricing_amount: string;
    currency: string;
};

export type BillingEvent = {
    id: string;
    event_type: string;
    amount: string;
    currency: string;
    details: string;
    created_at: string;
};

export type BillingMutationResult = {
    billing_event_id: string;
    event_type: string;
    amount: string;
    idempotency_status: string;
    idempotency_key?: string;
};

export type SimulateEventRequest = {
    event_type: string;
    amount?: number;
    details?: string;
    idempotency_key?: string;
};

// ─── LLM ───
export type LlmProviderStatus = {
    provider: string;
    model: string;
    api_key_configured: boolean;
    live_mode: string;
    timeout_seconds: number;
    max_retries: number;
    max_price_change_pct: string;
    simulation_available: boolean;
    ready_for_live: boolean;
    blocker_reason?: string | null;
};

export type LlmSuggestion = {
    item_name: string;
    current_unit_price: string;
    suggested_unit_price: string;
    confidence?: string;
    rationale?: string;
    provider?: string;
    model?: string;
    mode?: string;
};

export type LlmSuggestRequest = {
    item_name: string;
    current_unit_price: number;
    context?: string;
};

export type LlmApplyRequest = {
    estimate_id: string;
    line_item_id: string;
    suggested_price: number;
};

// ─── Activity / Audit ───
export type ActivitySummary = {
    estimates: number;
    line_items: number;
    billing_events: number;
    audit_events: number;
};

export type AuditEntry = {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
};

// ─── Backup ───
export type BackupPayload = {
    version: number;
    user_id: string;
    generated_at: string;
    estimates: Estimate[];
};

// ─── Admin ───
export type AdminSummary = {
    users: number;
    estimates: number;
    line_items: number;
    billing_events: number;
    billing_total_amount: string;
    catalog_nodes: number;
    catalog_items: number;
};

export type AdminUserRow = {
    id: string;
    email: string;
    role: string;
    full_name: string;
    created_at: string;
    estimates_count: number;
    billing_events_count: number;
    audit_events_count: number;
    last_login_at?: string | null;
    last_activity_at?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
};

export type AdminActivityRow = {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details?: string;
    created_at: string;
};

export type AdminBillingRow = {
    id: string;
    user_id: string;
    event_type: string;
    amount: string;
    currency: string;
    details?: string;
    created_at: string;
};

// ─── System ───
export type HealthResponse = { status: string; db: string };
