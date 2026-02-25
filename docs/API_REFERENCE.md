# API Reference (Human Maintained)

Last updated: February 25, 2026

This document covers request/response behavior and integration guidance.
For an always-current endpoint list generated from source, see [API_ENDPOINTS_GENERATED.md](API_ENDPOINTS_GENERATED.md).

## Auth Headers

- User-auth routes: `x-session-token`
- Admin read routes: `x-admin-key` or admin-role `x-session-token`
- Admin mutation routes (`POST /admin/demo-reset`, `POST /admin/audit-prune`): `x-admin-key`
- Optional request tracing header: `x-request-id` (if provided, echoed back in `X-Request-ID`)
- Legacy user header: `x-user-id` is disabled by default and should remain disabled in production.
- Local bootstrap routes (`/db/migrate`, `/db/seed`) are disabled when `REMODELATOR_ENV=production`.

## Core Request Schemas

### Health
- `GET /health`
- Response:
  - `status` (`ok`)
  - `db` (`ok`) after successful DB ping (`SELECT 1`)

### Register
- `POST /auth/register`
- Request:
  - `email` string (5-255)
  - `password` string (8-128)
  - `full_name` string (<=255)
- Response:
  - `user_id`
  - `email`
  - `role`
  - `session_token`

### Login
- `POST /auth/login`
- Request:
  - `email` string
  - `password` string
- Response:
  - `user_id`
  - `email`
  - `role`
  - `session_token`

### Profile update
- `PUT /profile`
- Request fields (all optional):
  - `full_name`
  - `labor_rate`
  - `item_markup_pct`
  - `estimate_markup_pct`
  - `tax_rate_pct`

### Estimate create
- `POST /estimates`
- Request:
  - `title`
  - `customer_name`
  - `customer_email`
  - `customer_phone`
  - `job_address`

### Estimate quick-start from catalog room
- `POST /estimates/{estimate_id}/quickstart`
- Request:
  - `catalog_node_name` (for example `Bathroom`, `Kitchen`)
  - `max_items` (1-50, default `5`)
- Behavior:
  - appends starter line items from the selected catalog room,
  - uses user defaults for item markup and labor rate,
  - recalculates totals immediately after insertion.

### Estimate line item create
- `POST /estimates/{estimate_id}/line-items`
- Request:
  - `item_name`
  - `quantity`
  - `unit_price`
  - `item_markup_pct` (optional)
  - `labor_hours`
  - `discount_value`
  - `discount_is_percent`
  - `group_name`

### Billing simulation
- `GET /billing/policy`
  - returns active billing mode and configured defaults (`annual_subscription_amount`, `realtime_pricing_amount`, `currency`)
- `GET /billing/provider-status`
  - returns billing provider mode/readiness (`simulation` or `stripe`) with:
    - `adapter_ready` (runtime adapter availability),
    - `ready_for_live` (provider + credentials + adapter readiness),
    - `blocker_reason` when live execution is blocked
- `GET /billing/subscription-state`
  - returns lifecycle summary for current subscription simulation state (`status`, flags, last event, configured amounts)
- `POST /billing/simulate-subscription`
- `POST /billing/simulate-estimate-charge`
- `POST /billing/simulate-refund`
- `POST /billing/simulate-event` (Stripe-like event simulation)
  - allowed `event_type` values:
    - `payment_method_attached`
    - `checkout_completed`
    - `usage_charge`
    - `invoice_paid`
    - `invoice_payment_failed`
    - `subscription_canceled`
  - lifecycle invariants are enforced:
    - `usage_charge`, `invoice_paid`, `invoice_payment_failed`, and `subscription_canceled` require an active/past-due subscription lifecycle context,
    - invalid lifecycle transitions return `400`.
- Shared fields:
  - `amount` (optional for subscription/estimate-charge/simulate-event; defaults come from `GET /billing/policy`)
  - `details`
  - `idempotency_key` (optional)

### LLM suggest/apply
- `POST /pricing/llm/live`
- `POST /pricing/llm/simulate` (deprecated compatibility alias to live OpenRouter behavior)
- Auth: user session token required
- Request:
  - `item_name`
  - `current_unit_price`
  - `context`

- `POST /pricing/llm/apply`
- Request:
  - `estimate_id`
  - `line_item_id`
  - `suggested_price`
- Apply behavior:
  - Suggested price is clamped by `REMODELATOR_LLM_PRICE_CHANGE_MAX_PCT` (default `20`) around current unit price.

### Admin reads
- Shared query:
  - `limit` (optional, 1-500, default 200)
- `GET /admin/summary` response fields:
  - `users`, `estimates`, `line_items`, `billing_events`
  - `billing_total_amount`
  - `catalog_nodes`, `catalog_items`
- `GET /admin/users` returns rows with:
  - `id`, `email`, `role`, `full_name`, `created_at`
  - `estimates_count`, `billing_events_count`, `audit_events_count`
  - `last_login_at`, `last_activity_at` (nullable timestamp fields)
  - query: `search` (optional, case-insensitive match on email/full name)
- `GET /admin/activity` returns rows with:
  - `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`
  - query: `user_id`, `action`, `entity_type` (all optional)
- `GET /admin/billing-ledger` returns rows with:
  - `id`, `user_id`, `event_type`, `amount`, `currency`, `details`, `created_at`
  - query: `user_id`, `event_type` (optional)
- `POST /admin/audit-prune` deletes audit rows older than retention window:
  - query: `retention_days` (optional, integer >= 1; defaults to `REMODELATOR_AUDIT_RETENTION_DAYS`)
  - query: `dry_run` (optional boolean, default `false`; when `true`, returns matched count without deleting)
  - response: `status`, `deleted`, `retention_days`, `cutoff_utc`, `dry_run`

## Response Patterns

- Common response headers:
  - `X-Request-ID` on all API responses
  - `X-RateLimit-Limit` and `X-RateLimit-Remaining` on rate-limited API paths when limiter is enabled
  - `Retry-After` on `429` responses

- Error payload envelope (all non-2xx responses):
  - `detail`: original error detail (string or validation list)
  - `error.code`: normalized class (`auth_error`, `validation_error`, `dependency_unavailable`, etc.)
  - `error.message`: human-readable message
  - `error.status`: HTTP status code
  - `request_id`: server trace identifier (matches `X-Request-ID`)

- Validation/business errors:
  - `400` with `detail`
- Operation conflicts (for example admin mutation lock already held):
  - `409` with `detail`
- Dependency blockers (for example OpenRouter unavailable for required LLM calls):
  - `503` with `detail`
- Auth errors:
  - `401` with `detail`
- Schema validation:
  - `422`
  - includes unknown/extra payload fields and invalid query bounds (for example `limit=0`).

Common success payload patterns:
- created/updated entity payloads (estimate, line-item, template)
- status payloads (`{"status": "ok"}` etc.)
- render payload (`{"rendered": "..."}`)
- export payload (`{"path": "..."}`)

## Integration Notes

1. Keep all monetary values as strings when passing through UI state to avoid accidental precision loss.
2. Always pass idempotency key when validating replay behavior for billing simulation.
3. For file export endpoints, output path must remain under configured `data` directory.
4. Use `GET /pricing/llm/status` to drive UI state before enabling live mode expectations.
   - status payload includes `max_price_change_pct` so UI/operators can see active clamp policy.
5. LLM calls are OpenRouter-only and fail-loud; no local simulation fallback path is used.
6. List-style endpoints enforce `limit` bounds from `1` to `REMODELATOR_API_LIMIT_MAX` (default `500`).
7. CORS allowlist is controlled by `REMODELATOR_CORS_ORIGINS`; production should set explicit origins.
8. API responses include baseline hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
9. Rate limiter controls are configuration-driven:
   - `REMODELATOR_API_RATE_LIMIT_ENABLED`
   - `REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS`
   - `REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX`
   - `REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX`
10. Billing execution routes are provider-aware:
   - `simulation` provider executes local ledger simulation,
   - `stripe` provider executes live billing flows and fails loud when required credentials are missing or invalid.
   - live Stripe usage charges include `return_url` in PaymentIntent confirmation (`STRIPE_PAYMENT_RETURN_URL` override, otherwise CORS/local fallback).
11. `POST /admin/demo-reset` uses a shared rebuild path (`service.rebuild_demo_database`) that is also used by CLI reset commands to keep reset/reseed behavior consistent.

## Endpoint Inventory

For exhaustive endpoint inventory generated from source:
- [API_ENDPOINTS_GENERATED.md](API_ENDPOINTS_GENERATED.md)
