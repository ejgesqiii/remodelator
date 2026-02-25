# Remodelator vNext

API-first rebuild of Remodelator focused on a full local functional demo first, then production hardening.

## Verified Status (February 25, 2026)

- backend regression suite is green (`pytest -q`).
- Stripe-focused regression suites are green: `tests/test_billing_runtime.py`, `tests/test_api_flow.py`, `tests/test_cli_flow.py`
- frontend type/build gate is green: `cd apps/web && npm run build`
- Stripe sandbox hardening now includes:
  - idempotent SQLite schema upgrades for new Stripe columns/indexes
  - Stripe command compatibility across API/CLI/runtime paths
  - webhook persistence path for subscription/refund/cancel flows
  - per-user billing idempotency storage (bounded key format + backward-compatible lookup)
  - normalized billing money serialization (`.2f`) for stable API/CLI contracts

## Product Direction

Target outcome:
- leaner architecture,
- deterministic pricing,
- full core workflows via UI,
- admin-controlled demo reset,
- clean migration path to production integrations.

Current UI direction:
- React + TypeScript web app (`apps/web`) as primary client.
- Existing FastAPI backend remains the contract source of truth.

Confirmed business decisions now baked into scope:
- launch accounts are single-user only (no team tenancy in this phase),
- billing model is hybrid (`$1200/year` + `$10` per real-time pricing run),
- proposal content remains neutral/default for this prototype phase,
- catalog uses seeded + admin-managed records now; Home Depot/Lowes scraping is post-prototype.

UI quality standard:
- human-readable workflow screens and outputs,
- no raw JSON surfaces for core user journeys,
- full feature control through web UI including admin demo reset.

Backend quality standard:
- deterministic Decimal pricing logic in domain layer,
- API-first contracts with typed frontend integration,
- provider-driven billing runtime (`simulation` and `stripe`) plus OpenRouter-required LLM with fail-loud behavior,
- structured request tracing (`X-Request-ID`) and config-driven API rate limiting.

## Repository Map

Core implementation:
- `src/remodelator/domain`: pricing and business rules
- `src/remodelator/application`: use-case orchestration
- `src/remodelator/infra`: DB models, persistence, external adapters
- `src/remodelator/interfaces/api`: FastAPI endpoints
- `src/remodelator/interfaces/cli`: Typer CLI
- `apps/web`: React web client (API-first, Feature-sliced Architecture, React Router, TanStack Query, Tailwind v4)

Project support:
- `requirements.txt`: backend runtime install wrapper (`-e .`)
- `requirements-dev.txt`: backend dev/test/lint install wrapper (`-e .[dev]`)
- `tests`: backend tests
- `data`: local SQLite DB, exports, generated demo artifacts
- `scripts`: helper scripts to run API/web demo
- `scripts/bootstrap_local.sh`: one-command local dependency bootstrap
- `scripts/README.md`: canonical script index and quickstart command map
- `ARCHITECTURE.md`: exhaustive technical architecture and API/UI reference
- `docs/README.md`: documentation index and maintenance commands
- `docs/TECH_DECISIONS.md`: explicit architecture/auth/integration decision records
- `docs/API_REFERENCE.md`: maintained request/response and integration notes
- `docs/API_ENDPOINTS_GENERATED.md`: generated source-of-truth endpoint list
- `docs/LAUNCH_EVIDENCE_CHECKLIST.md`: launch-operability verification checklist
- `archive/docs/UI_UX_INTERACTIONS.md`: historical panel-level UX flow notes
- `archive/docs/BLOCKERS_AND_ROADMAP.md`: historical blocker matrix snapshot
- `archive/docs/NON_BLOCKER_COMPLETION.md`: historical completion scorecard
- `ACTION_PLAN.md`: exhaustive phased roadmap

Archive artifacts (non-authoritative, historical only):
- `_notes_/*` is retained for background context and does not define current build scope/spec.
- superseded planning/handover docs are retained under `archive/docs/*`

## Current Functional Coverage

Backend/CLI/API currently supports:
- user registration/login/profile updates
- estimate lifecycle: create/update/status/lock/unlock/duplicate/version
- estimate quick-start from catalog room (`/estimates/{estimate_id}/quickstart`)
- line-item operations: add/edit/remove/reorder/group
- deterministic Decimal-based recalculation
- catalog tree/search (user-facing) plus admin-only upsert/import and seed data
- template save/apply
- proposal text render and PDF generation
- billing simulation and ledger
- billing idempotency replay via key
- Stripe-like billing lifecycle simulation (`payment_method_attached`, `checkout_completed`, `usage_charge`, `invoice_*`, `subscription_canceled`)
- billing lifecycle transition validation to prevent invalid event ordering
- live Stripe integration via `StripeBillingAdapter` and `StripeService`
- production billing webhook listener with signature verification
- provider-driven billing runtime (simulation or stripe provider active)
- OpenRouter-backed LLM pricing suggestions (no local fallback path)
- LLM provider status endpoint (`/pricing/llm/status`)
- audit/activity reporting
- user backup export/restore APIs
- admin summary/users/activity/billing ledger
- admin demo reset endpoint and CLI command (UI requires explicit `x-admin-key` entry for destructive actions)
- migration dry-run SQL analyzer with row/column validation and JSON report output
- snapshot reconciliation diff tooling for migration verification
- secure password hashing (PBKDF2) with automatic legacy SHA-256 hash upgrade on successful login
- signed session token auth (`x-session-token`) for API requests
- request ID and rate-limit response headers on API traffic
- structured per-request API logs with request ID correlation

Web currently supports:
- register/login/logout
- profile defaults load/update (name, labor rate, markups, tax)
- user activity snapshot + recent audit trail
- snapshot export + restore-last-snapshot from UI
- estimate create/select/detail update (customer fields, markup, tax)
- estimate quick-start from room category (Bathroom/Kitchen/etc) to seed starter items
- line-item add/edit/remove/reorder/group with advanced pricing fields
- estimate add-item panel with inline catalog picker (category tree + search + one-click add)
- catalog management (upsert/import JSON) from web for admin-role sessions only
- estimate actions: recalc/status/duplicate/version/unlock
- template save/apply/list
- proposal render
- proposal PDF generation trigger
- estimate JSON export trigger
- LLM price suggest/apply (OpenRouter live required)
- billing simulate estimate charge/subscription/refund with optional idempotency key
- Stripe simulation controls for card attach, checkout completion, usage charge, invoice webhook events, and cancel-subscription flow
- structured billing response cards (event/amount/idempotency/event-id) in UI
- billing ledger view
- structured LLM suggestion cards (price/mode/provider/model/confidence/rationale) in UI
- global dependency blocker banners for LLM readiness and Stripe live-billing readiness
- admin summary/users/activity/billing/demo reset controls
- admin audit prune supports both preview (`dry_run`) and execute from UI
- full Playwright golden-path demo scenario (register -> estimate workflow -> template -> billing replay -> admin reset)

## Quickstart (Backend)

1. Install dependencies (recommended):
```bash
./scripts/bootstrap_local.sh
```
Backend-only bootstrap:
```bash
./scripts/bootstrap_local.sh --skip-web
```

Manual install alternative (Python 3.12+ backend):
```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements-dev.txt
```

Alternative editable install command (equivalent):
```bash
python3 -m pip install -e '.[dev]'
```
Runtime-only install (no test/lint extras):
```bash
python3 -m pip install -r requirements.txt
```

2. Initialize local DB and seed catalog:
```bash
remodelator db migrate
remodelator db seed
```

3. Run tests:
```bash
python3 scripts/generate_api_endpoints_doc.py --check
python3 scripts/check_markdown_links.py --check --include-archive
pytest -q
```

Or run the full local quality gate:
```bash
./scripts/quality_gate.sh
```
Use this same command in CI to keep local and pipeline gates aligned.
Run dead/unused-code checks directly:
```bash
./scripts/dead_code_check.sh
```

Capture a timestamped evidence bundle (quality gate + docs sync + SQLite probes):
```bash
./scripts/capture_release_evidence.sh
```
This produces `data/evidence/<UTC_TIMESTAMP>/SUMMARY.md` and `NON_BLOCKER_STATUS.json`.
Check latest bundle status quickly:
```bash
./scripts/latest_evidence_status.sh
```
Maintain evidence artifacts:
```bash
./scripts/evidence_index.sh
./scripts/evidence_prune.sh --keep 20
```
Run SQLite operability probes directly (same checks used in CI):
```bash
./scripts/ci_sqlite_probes.sh
```
Optional path overrides:
```bash
REMODELATOR_CI_SQLITE_DATA_DIR=/tmp/remodelator_ci_data \
REMODELATOR_CI_OUTPUT_DIR=/tmp/remodelator_ci_outputs \
./scripts/ci_sqlite_probes.sh
```
Run a live Stripe sandbox probe and capture sanitized raw API responses:
```bash
python3 scripts/stripe_sandbox_probe.py --output data/stripe_probe/latest.json
```
Run a full signed Stripe webhook golden path against a running API:
```bash
python3 scripts/stripe_webhook_golden_path.py --api-base-url http://127.0.0.1:8000 --output data/stripe_webhook_golden_path/latest.json
```
Run the consolidated Stripe release gate:
```bash
./scripts/stripe_release_gate.sh --env-file .env --api-port 8010 --output data/stripe_release_gate/latest.json
```

4. Start API:
```bash
./scripts/run_api.sh
```

API docs and health:
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/health`
- health endpoint includes DB ping status (`status`, `db`).

Migration dry-run tooling (local):
```bash
remodelator migrate legacy-sql --path ./legacy.sql --json
remodelator migrate legacy-sql --path ./legacy.sql --report-output ./data/migration_report.json --json
remodelator migrate reconcile --source-snapshot ./data/source.json --migrated-snapshot ./data/migrated.json --json
remodelator migrate reconcile --source-db ./data/source.sqlite3 --migrated-db ./data/migrated.sqlite3 --json
remodelator migrate reconcile --source-db ./data/source.sqlite3 --migrated-db ./data/migrated.sqlite3 --report-output ./data/reconcile_report.json --json
remodelator db integrity-check --json
remodelator db sqlite-maintenance --json
remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 5 --json
remodelator billing policy-show --json
remodelator billing provider-status-show --json
remodelator billing subscription-state-show --json
remodelator pricing llm-status --json
remodelator estimate quickstart <ESTIMATE_ID> --catalog-node-name Bathroom --max-items 5 --json
```

## Auth Model

Current auth approach (lean + maintainable):
- `POST /auth/register` and `POST /auth/login` return `session_token`.
- Auth responses and profile payload include `role` (`user` or `admin`).
- Protected endpoints accept `x-session-token` (preferred).
- `x-user-id` is disabled by default and can be explicitly re-enabled for temporary legacy compatibility.
- `forgot password` is explicitly deferred in this prototype phase until email delivery infrastructure is introduced.
- Request payload contracts are strict: unknown JSON fields are rejected with `422`.
- Core health/auth/profile/admin routes use explicit response models to keep API contracts stable and typed.

Production-safe settings:
```bash
export REMODELATOR_ENV='production'
export REMODELATOR_SESSION_SECRET='<strong-random-secret>'
export REMODELATOR_SESSION_TTL_SECONDS='43200'
export REMODELATOR_ALLOW_LEGACY_USER_HEADER='false'
export REMODELATOR_ADMIN_USER_EMAILS='owner@example.com,ops@example.com'
export REMODELATOR_API_LIMIT_MAX='500'
export REMODELATOR_CORS_ORIGINS='https://app.example.com'
export REMODELATOR_API_RATE_LIMIT_ENABLED='true'
export REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS='60'
export REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX='120'
export REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX='240'
export REMODELATOR_AUDIT_RETENTION_DAYS='365'
export REMODELATOR_SQLITE_JOURNAL_MODE='WAL'
export REMODELATOR_SQLITE_SYNCHRONOUS='NORMAL'
export REMODELATOR_SQLITE_BUSY_TIMEOUT_MS='5000'
export REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS='10'
export REMODELATOR_BILLING_ANNUAL_SUBSCRIPTION_AMOUNT='1200.00'
export REMODELATOR_BILLING_REALTIME_PRICING_AMOUNT='10.00'
export REMODELATOR_BILLING_CURRENCY='USD'
export REMODELATOR_BILLING_PROVIDER='simulation'
export STRIPE_SECRET_KEY='sk_test_...'
export STRIPE_WEBHOOK_SECRET='whsec_...'
export STRIPE_API_VERSION='2026-01-28.clover'
export STRIPE_PAYMENT_RETURN_URL='https://app.example.com/billing/return'
```

Request tracing + throttling behavior:
- responses include `X-Request-ID` (echoed from request header if provided, otherwise generated),
- API rate limiting is enforced for non-static API paths when enabled,
- rate-limited responses return `429` with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining`.
- non-2xx responses include a consistent error envelope: `detail` + `error{code,message,status}` + `request_id`.

## Quickstart (React Web)

1. Start backend API first:
```bash
./scripts/run_api.sh
```

2. Start web app:
```bash
./scripts/run_web.sh
```

3. Open:
- `http://127.0.0.1:5173`

4. Run web tests:
```bash
npm --prefix apps/web test
npm --prefix apps/web run test:e2e
```

Notes:
- web dev server proxies `/api/*` to backend `127.0.0.1:8000`.
- admin key default is `local-admin-key` unless overridden.
- `scripts/run_web.sh` installs dependencies with `npm ci` only when `apps/web/node_modules` is missing.

## Admin and Demo Reset

Admin access model:
- Admin read endpoints (`/admin/summary`, `/admin/users`, `/admin/activity`, `/admin/billing-ledger`) accept either:
  - valid `x-admin-key`, or
  - admin-role `x-session-token` (email in `REMODELATOR_ADMIN_USER_EMAILS`).
- Catalog mutation endpoints (`/catalog/upsert`, `/catalog/import`) require an admin-role `x-session-token`.
- Demo reset (`/admin/demo-reset`) requires valid `x-admin-key`.

Local default key:
- `local-admin-key`

Web UI includes admin actions for:
- summary
- users
- activity
- billing ledger
- demo reset

Admin read filters supported:
- `limit` (1-500)
- users: `search` (email/full-name match)
- activity: `user_id`, `action`, `entity_type`
- billing ledger: `user_id`, `event_type`

Demo reset behavior:
- drops and recreates local schema,
- reseeds catalog,
- invalidates prior user sessions.
- uses one shared backend rebuild path for API and CLI reset consistency.

## OpenRouter Live LLM Mode

Default model currently configured:
- `google/gemini-2.5-flash`

Set environment variables:
```bash
export OPENROUTER_API_KEY='<your_key>'
export OPENROUTER_MODEL='google/gemini-2.5-flash'
export OPENROUTER_MAX_RETRIES='2'
export OPENROUTER_TIMEOUT_SECONDS='30'
export OPENROUTER_RETRY_BACKOFF_SECONDS='0.6'
export REMODELATOR_LLM_PRICE_CHANGE_MAX_PCT='20'
```

Then use CLI or API live pricing endpoints.

LLM behavior:
- `/pricing/llm/live`: OpenRouter live call with retry and fail-loud errors.
- `/pricing/llm/simulate`: deprecated compatibility alias that routes to live OpenRouter behavior (no simulation fallback).
- `/pricing/llm/status`: current provider/model/config status for UI and diagnostics.
- critical provider failures surface as `503` API responses.
- Note: LLM suggest endpoints require user session auth (`x-session-token`).

Billing simulation behavior:
- `/billing/policy`: active billing mode + configured annual/usage amounts.
- `/billing/provider-status`: current provider readiness (`simulation` vs `stripe`) with blocker reason when live mode is not ready.
- `/billing/subscription-state`: current subscription lifecycle summary (active/past_due/canceled + last event).
- `/billing/simulate-estimate-charge`: defaults to configured real-time pricing amount if amount omitted.
- `/billing/simulate-subscription`: defaults to configured annual subscription amount if amount omitted.
- live Stripe usage charges include a `return_url` for PaymentIntent confirmation (`STRIPE_PAYMENT_RETURN_URL` with CORS/local fallback).
- `/billing/simulate-event`: Stripe-like lifecycle/webhook simulation endpoint (`payment_method_attached`, `checkout_completed`, `usage_charge`, `invoice_paid`, `invoice_payment_failed`, `subscription_canceled`).
- `/admin/audit-prune`: deletes audit rows older than configured retention window (`REMODELATOR_AUDIT_RETENTION_DAYS`, optional per-call override, supports `dry_run=true` preview mode).

## Feasibility and External Inputs

What is fully feasible now on local disk (no external systems required):
- full non-LLM UI workflows and API behavior,
- SQLite-backed data, exports, billing simulation ledger, admin reset,
- deterministic pricing and proposal generation.

What is required external dependency (blocking for LLM demo scope):
- OpenRouter API key and network access for LLM calls (`/pricing/llm/live`).
- LLM failures are fail-loud and treated as blocker conditions for demo readiness.

What remains externally provided by client for production-final signoff:
1. pricing validation samples (2-3 legacy known-output examples),
2. hybrid billing policy details (`$10` trigger/retry/reversal semantics),
3. OpenRouter launch ownership/usage limits/compliance constraints,
4. retention/compliance policy requirements,
5. expected launch concurrency envelope,
6. written confirmation on legacy credential rotation status (if legacy environments still active).

Authoritative tracker for these inputs:
- `ACTION_PLAN.md` sections "Open Questions (Real External Blockers Only)" and "Client Input Package (Exact Needed Artifacts)"

## Security Notes

- Do not commit API keys or secrets.
- Rotate any key that has been exposed.
- Legacy archive contents include plaintext credentials in `web.config`; treat them as compromised until rotated.
- Password policy: minimum 8 characters.
- API export write paths are restricted to the configured local `data` directory.
- SQLite runtime hardening is enabled by default:
  - `PRAGMA foreign_keys=ON`
  - `PRAGMA journal_mode=WAL` (configurable)
  - `PRAGMA synchronous=NORMAL` (configurable)
  - `PRAGMA busy_timeout=5000` ms (configurable)
- For production mode, set:
```bash
export REMODELATOR_ENV='production'
export REMODELATOR_ADMIN_API_KEY='<strong-random-admin-key>'
export REMODELATOR_SESSION_SECRET='<strong-random-secret>'
```
Production mode rejects the default admin key (`local-admin-key`).
- `db/migrate`, `db/seed`, and `admin/demo-reset` are blocked in production mode.

## What Is Next

See `ACTION_PLAN.md` for full phased scope.

Execution approach:
- work is batched in parallel 2-3 day cycles across Product/UX, Domain/API, and Quality/Ops,
- each batch ends with full backend/web/e2e/doc checks to keep velocity high without quality drift.

Immediate priorities:
1. finalize pricing rule confirmations with client-backed fixtures
2. lock hybrid billing policy details into simulation + live-billing adapter contracts
3. finalize production policy controls (retention/export requirements)
4. complete launch hardening package (SQLite operating profile + deploy/restore evidence)
