# Remodelator vNext Action Plan

Last updated: February 25, 2026  
Mode: API-first product build, polished React UI, full local functional demo first, production readiness second
Spec authority: current codebase + active docs in root/docs (historical `notes/*` is non-authoritative)

## 1) Product Objective

Build a lean, maintainable, objectively better Remodelator with no core workflow loss.

Success means:
- every core workflow runs from UI without terminal dependency,
- pricing and totals are deterministic and test-backed,
- billing is simulation-safe and production-switchable,
- LLM runs through OpenRouter only (no local fallback path),
- admin can reset demo state instantly,
- architecture is clean enough to ship to production without rewrite.

## 2) Non-Negotiable End State (Local Demo)

A local build is "finished" only when all items below are usable via web UI:
1. register/login/logout
2. profile defaults update
3. estimate create/read/update/status/lock/unlock/duplicate/version
4. estimate quick-start from catalog room categories
5. line item add/edit/remove/reorder/group
6. deterministic recalc with visible subtotal/tax/total
7. catalog tree/search/upsert/import
8. templates save/list/apply
9. proposal render and PDF export
10. estimate export
11. billing simulation (estimate charge, subscription, refund)
12. idempotency replay verification for billing actions
13. Stripe-like billing lifecycle simulation (card attach, checkout complete, usage charge, invoice webhook events, cancel subscription page flow)
14. LLM pricing suggest/apply (OpenRouter live required; failures are blocking)
15. admin summary/users/activity/billing ledger
16. admin demo reset + post-reset baseline verification
17. audit/activity visibility for critical actions
18. user data snapshot export/restore for local demo safety
19. forgot-password flow explicitly deferred until email delivery capability is implemented

## 3) UX Product Standard (Hard Rules)

The UI must be client-facing quality, not an internal debug surface.

Required UX rules:
- no raw JSON blocks in primary user flows,
- every response is translated into human-readable status cards/lists,
- clear panel/page hierarchy (Session, Workspace, Catalog/Templates, Billing/Output, Admin),
- meaningful empty states and actionable errors,
- mobile/tablet-safe layouts,
- keyboard-usable controls and predictable focus behavior,
- destructive actions visibly separated (demo reset, delete/remove flows).

Acceptance criteria for UX:
1. first-time user can complete estimate creation to proposal render without guidance,
2. financial outputs are visible after every write path,
3. admin can run demo reset and verify baseline in <2 minutes,
4. no screen depends on viewing data in raw technical format.

## 4) Architecture Baseline

### Backend (Python)
- Python 3.12 + FastAPI + SQLAlchemy + Pydantic + Typer.
- Layers:
  - `src/remodelator/domain`: business rules and deterministic pricing
  - `src/remodelator/application`: use-case orchestration
  - `src/remodelator/infra`: persistence, adapters, integrations
  - `src/remodelator/interfaces/api`: HTTP contracts
  - `src/remodelator/interfaces/cli`: operational CLI

### Frontend (React)
- React + TypeScript + Vite.
- API-only client behavior (no domain logic in UI).
- Componentized panels/modules with typed contracts.

### Data
- Local demo: SQLite (`data/remodelator.sqlite3`)
- Production baseline: hardened SQLite (WAL, busy-timeout, backup/restore runbooks)
- Optional later: PostgreSQL compatibility track if scale/compliance demands it

## 5) API Standards (Modern Best Practices)

API quality requirements:
1. consistent request/response schema conventions across domains
2. deterministic Decimal money handling throughout services
3. idempotency support for billing mutation endpoints
4. explicit validation and readable error payloads
5. OpenAPI as contract source of truth
6. typed frontend API client generated/maintained from contract types
7. no business rules duplicated in controller layer
8. session-token authentication for protected routes (`x-session-token`), with legacy header disabled in production

Endpoint domains in scope:
- `/auth/*`, `/profile`
- `/estimates/*`
- `/catalog/*`
- `/templates/*`
- `/proposals/*`
- `/billing/*`
- `/pricing/llm/*`
- `/audit`, `/activity`
- `/admin/*`

## 6) Configuration Master Knobs (Single Source of Behavior)

Core runtime knobs:
1. `REMODELATOR_ENV`
2. `REMODELATOR_DATA_DIR`
3. `REMODELATOR_DB_URL`
4. `REMODELATOR_SQLITE_JOURNAL_MODE`
5. `REMODELATOR_SQLITE_SYNCHRONOUS`
6. `REMODELATOR_SQLITE_BUSY_TIMEOUT_MS`
7. `REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS`

Security/auth knobs:
1. `REMODELATOR_SESSION_SECRET`
2. `REMODELATOR_SESSION_TTL_SECONDS`
3. `REMODELATOR_ALLOW_LEGACY_USER_HEADER`
4. `REMODELATOR_ADMIN_API_KEY`
5. `REMODELATOR_ADMIN_USER_EMAILS`

API contract knobs:
1. `REMODELATOR_API_LIMIT_MAX` (global list endpoint cap)
2. `REMODELATOR_CORS_ORIGINS` (comma-separated allowed web origins)
3. `REMODELATOR_API_RATE_LIMIT_ENABLED`
4. `REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS`
5. `REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX`
6. `REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX`
7. `REMODELATOR_AUDIT_RETENTION_DAYS`

Billing knobs:
1. `REMODELATOR_BILLING_ANNUAL_SUBSCRIPTION_AMOUNT`
2. `REMODELATOR_BILLING_REALTIME_PRICING_AMOUNT`
3. `REMODELATOR_BILLING_CURRENCY`
4. `REMODELATOR_BILLING_PROVIDER` (`simulation` or `stripe`)
5. `STRIPE_SECRET_KEY` (required for live stripe mode)
6. `STRIPE_WEBHOOK_SECRET` (required when webhook validation is enabled)

LLM knobs:
1. `OPENROUTER_API_KEY`
2. `OPENROUTER_MODEL`
3. `OPENROUTER_TIMEOUT_SECONDS`
4. `OPENROUTER_MAX_RETRIES`
5. `OPENROUTER_RETRY_BACKOFF_SECONDS`
6. `REMODELATOR_LLM_PRICE_CHANGE_MAX_PCT`

## 7) Integration Strategy

Local integration posture:
- billing: local simulation ledger and replay checks
- LLM: OpenRouter live calls are mandatory for all suggestion flows
- LLM failures are fail-loud and treated as blockers, not downgraded behavior

Production-ready seams:
- billing adapter interface keeps Stripe/live integration swappable
- LLM provider wrapper supports OpenRouter model config at runtime
- environment-driven provider and credential configuration only

## 8) Testing and Quality Gates

### Backend gates
1. pricing fixture tests (deterministic totals and rounding)
2. service-level tests for estimate/catalog/template/billing flows
3. API integration tests across all write endpoints
4. demo reset regression tests
5. LLM live reliability tests (status, retry path, and fail-loud behavior)
6. docs sync gate: regenerate endpoint inventory from source and keep architecture references current
7. docs link-integrity gate: validate active markdown references (`scripts/check_markdown_links.py --check`)
8. SQLite operability probe pack (`scripts/ci_sqlite_probes.sh`) in CI/local for integrity, maintenance, and concurrency envelope validation

### Frontend gates
1. component tests for critical interactions
2. app smoke tests for panel rendering and navigation
3. Playwright e2e for golden demo flow

### Golden demo flow (must pass)
1. register/login
2. create estimate
3. add/reorder/group/edit lines
4. run recalc
5. save/apply template
6. render proposal
7. run billing simulation + replay check
8. run admin summary/activity
9. demo reset
10. verify reseeded baseline

## 9) Security and Operational Controls

Immediate controls:
1. secrets only in environment variables
2. rotate known-exposed legacy credentials
3. audit logs for critical writes/admin actions
4. admin key required for reset; admin reads allowed via admin-role session or admin key
5. strong password hashing with legacy-hash upgrade path
6. server-side file export path restrictions (data directory only)
7. config-driven CORS allowlist + baseline secure response headers
8. request ID response header and structured request logging for traceability
9. config-driven request-rate limiting for public and authenticated API traffic
10. cross-process admin mutation lock for destructive operations (`demo-reset`, audit prune)

Before production go-live:
1. RBAC model and role-scoped admin actions
2. production auth/session hardening
3. live billing webhook handling and retry safety
4. structured logs/metrics and runbooks
5. legacy `x-user-id` header disabled in production (session-token only)
6. legacy header disabled by default across all environments unless explicitly enabled for transition
7. SQLite operations hardening package (backup cadence, restore drills, integrity checks, vacuum/analyze routine)
8. load-test and tune request-rate-limit thresholds for launch envelope
9. audit log retention/export policy implementation based on client compliance requirements

## 10) Batched Execution Model (Rapid Progress)

Execution is explicitly parallel, not single-threaded.

Active workstreams per batch:
1. Product/UX stream: visible user workflow improvements and simplification.
2. Domain/API stream: contract hardening, auth/security, and integration boundaries.
3. Quality/Ops stream: tests, docs, CI, diagnostics, and deploy readiness.

Batch rules:
1. Batch length: 2-3 working days.
2. Every batch must ship at least one item from each stream.
3. WIP limit: max 2 active items per stream (max 6 active items total).
4. End-of-batch gate: backend tests + web tests + e2e + docs sync check all green.
5. End-of-batch artifact: short demo note (what changed, what is now safer/faster/clearer).

Blocker handling policy:
1. external blocker does not pause all work,
2. blocked items move behind assumption flags,
3. non-blocked stream items continue in same batch,
4. assumptions are isolated so they can be replaced without large rewrites.

## 11) Phased Scope (Overlapping, Not Sequential)

### Phase 1: Local Demo Completion and Stabilization (completed)
Parallel outputs delivered:
1. core workflows fully controllable via web UI,
2. simulation-first billing plus OpenRouter-only LLM wiring with fail-loud behavior,
3. admin reset + operational safety controls + golden e2e coverage.

### Phase 2: Contract Lock + Hardening Foundation (current)
Parallel batch contents:
1. Product/UX: reduce UI complexity and improve clarity for customer review.
2. Domain/API: lock pricing fixtures, enforce single-user and hybrid-billing defaults, remove duplication.
3. Quality/Ops: expand auth/dependency tests, keep docs generated and in sync.

Exit gate:
1. pricing rules validated against client/legacy fixtures or accepted assumption matrix.

### Phase 3: Production-Critical Buildout (next)
Parallel batch contents:
1. Product/UX: single-user workflow polish, hybrid billing UX clarity, and launch readiness QA flows.
2. Domain/API: SQLite production hardening controls, live billing adapter path, catalog-ingestion extension seams.
3. Quality/Ops: runbooks, restore-drill evidence, and launch evidence package.

Exit gate:
1. no architectural rewrite required to move from local demo to production.

### Phase 4: Launch Readiness and Rollout
Parallel batch contents:
1. Product/UX: UAT polish and acceptance checklist completion.
2. Domain/API: production config hardening, rollout safety switches.
3. Quality/Ops: deploy pipeline checks, policy compliance signoff package.

Exit gate:
1. production go-live decision can be made on evidence, not assumptions.

## 12) Scope Beyond Local Demo Approval

1. Home Depot/Lowes catalog ingestion automation and normalization pipeline
2. optional multi-role/team model (only if business scope expands)
3. richer analytics/reporting dashboards
4. queue-backed long-running tasks (exports/proposals)
5. full admin audit console with filter/retention controls
6. live payments and webhook operations package
7. customer-facing portal/mobile shell if required

## 13) Open Questions (Real External Blockers Only)

1. final pricing order and rounding policy confirmation from client data
2. hybrid billing event policy details (`$10` trigger, retries/refunds/corrections)
3. required audit/data retention policy for production
4. expected launch concurrency/traffic profile to validate SQLite sizing envelope
   - internal probe command ready: `remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 5 --json`
5. written confirmation that legacy plaintext credentials are rotated (if legacy env still active)

## 14) Client Input Package (Exact Needed Artifacts)

To close all remaining ambiguity, collect these exact inputs:

1. Pricing validation package:
   - 2-3 real legacy estimates with:
     - input fields (qty, unit price, markups, discounts, labor, tax)
     - final expected totals
   - optional: explicit formula order if available.
2. Hybrid billing operations package:
   - confirm when the `$10` real-time pricing charge is created,
   - confirm required behavior for retries, reversals/refunds, duplicate prevention, and cancel-at-period-end behavior.
3. Compliance/retention package:
   - audit retention duration,
   - required export/deletion behavior and related policy constraints.
4. Launch envelope package:
   - expected user/concurrency envelope,
   - validate against internal SQLite envelope probe results.
5. Security confirmation package:
   - written confirmation on legacy credential rotation status.
6. Catalog ingestion scope package (post-prototype track):
   - source constraints for Home Depot/Lowes scraping,
   - required normalized schema fields and update cadence expectations.

Fallback assumptions while waiting:
1. deterministic current pricing order remains active,
2. no legacy migration package is required for prototype completion,
3. single-user model remains launch baseline,
4. hybrid billing model remains canonical (`$1200/year` + `$10` real-time pricing event),
5. neutral proposal template remains active for this prototype phase,
6. project-owned OpenRouter credential remains required and managed internally for all LLM runs,
7. conservative retention/export defaults remain active until policy guidance is provided.

## 15) Definition of Done (Local Demo Final)

The local demo is accepted as "final internal review build" only when all are true:
1. every item in section 2 is fully usable from UI without CLI fallback,
2. backend + frontend + e2e + docs checks pass via `scripts/quality_gate.sh`,
3. demo reset reliably returns the system to known baseline state,
4. pricing behavior is deterministic and covered by explicit tests,
5. no raw debug JSON is required for primary user journeys,
6. configuration knobs in section 6 are documented and sufficient to run local/prod profiles.

## 16) Current Batch Backlog (Now)

Batch A (complete):
1. Product/UX modularization and panel decomposition complete.
2. Domain/API route splits and service extraction baseline complete.
3. Quality/Ops quality-gate + docs-sync discipline established.
4. Execution board and close artifacts: `archive/docs/BATCH_A_TASKBOARD.md`, `archive/docs/BATCH_A_DEMO_NOTE.md`.

Batch B (complete):
1. Product/UX: improve admin and billing interaction polish for client walkthrough.
2. Domain/API: finalized error-contract consistency, request-rate limiting, lifecycle invariants, and production-auth guards.
3. Quality/Ops: finalized launch evidence pack (quality gate, security checks, operating runbook).  
   Artifact baseline: `docs/LAUNCH_EVIDENCE_CHECKLIST.md`, `docs/SQLITE_OPERATIONS_RUNBOOK.md`, `archive/docs/DEPLOYMENT_HARDENING_CHECKLIST.md`.
4. Active execution board: `archive/docs/BATCH_B_TASKBOARD.md`.

Batch C (complete):
1. Product/UX: launch-operability UX cleanup and hybrid billing transparency in admin/reporting.
2. Domain/API: live billing provider adapter and policy-driven retention/export controls.
3. Quality/Ops: deployment hardening artifacts and restore drills.

Batch D (Handover / Verification):
1. Hardening: Resolving test suite regressions (decimal precision, SQLite unique constraints).
2. Verification: Final sandbox E2E walkthroughs.
3. Documentation: Root-level audit and final sync (complete).

## 17) Definition of "Objectively Better"

Measured by outcomes:
- fewer moving parts in core architecture,
- deterministic pricing with explicit tests,
- no hidden terminal-only path for core workflows,
- faster onboarding and demo reset cycles,
- lower regression risk through contract + e2e coverage,
- clean local-to-production hardening path.

## 18) Blocker Impact Matrix (No Ambiguity)

Each external input blocks only specific completion gates, not all progress:

1. Pricing validation package:
   - blocks: pricing fixture final signoff and production-pricing lock.
   - does not block: UI/UX polish, API hardening, simulation flows, test infra.
2. Hybrid billing policy details:
   - blocks: live billing adapter finalization and production invoicing semantics.
   - does not block: billing simulation workflow and idempotency validation.
3. OpenRouter availability/configuration:
   - blocks: only LLM suggestion workflows.
   - does not block: billing simulation, estimate/catalog/templates, and non-LLM admin flows.
4. Retention/compliance policy:
   - blocks: final production audit retention/export implementation.
   - does not block: local demo workflows and core business validation.
5. Security confirmation on legacy credentials:
   - blocks: closure of known legacy-risk item in launch evidence.
   - does not block: local demo execution.

## 19) Definition of Done (Production Release Target)

Production release is complete only when all are true:
1. local demo Definition of Done (section 15) is fully met and stable,
2. pricing fixtures are client-validated or validated against legacy known-output examples,
3. hybrid billing behavior (`$1200/year` + `$10` pricing event semantics) is validated in simulation and live adapter readiness tests,
4. live billing integration path is implemented and validated against agreed billing model details,
5. auth model is finalized for single-user launch scope,
6. deployment runbook, backup/restore, and rollback checklist are documented and tested,
7. all quality gates pass on production profile settings (no dev bypass assumptions).

## 21) Appendix A: Hardening Status (Resolved on February 25, 2026)

The Stripe hardening regressions discovered during Phase E are resolved in the current codebase state.

Resolved items:
- Decimal precision normalization for billing responses (`10.00` contract consistency on create/replay/read paths).
- SQLite schema compatibility migration for legacy local DB files (Stripe user columns/indexes auto-upgrade on migrate/init).
- Stripe usage-charge runtime conflicts from duplicate mock customer IDs (safe remap flow before update).
- Webhook subscription-state synchronization (subscription ID propagation and parsed state visibility).
- Stripe runtime command compatibility alignment across API/CLI/runtime command names.

Verification evidence:
- `pytest -q` -> `117 passed`
- `pytest -q tests/test_billing_runtime.py tests/test_api_flow.py tests/test_cli_flow.py` -> `30 passed`
- `cd apps/web && npm run build` -> success (`tsc --noEmit` + Vite build)
