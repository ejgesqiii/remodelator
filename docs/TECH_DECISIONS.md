# Technical Decisions (ADR-lite)

Last updated: February 25, 2026

## D1: API-First Monolith for vNext

Decision:
- Keep a single Python backend service with clear domain/application/infra/interface boundaries.

Why:
- Lowest operational complexity for a lean team.
- Fastest iteration loop while preserving clean seams for future extraction.

Implication:
- No microservice split until scale and ownership boundaries justify it.

## D2: Signed Session Token Auth for User Flows

Decision:
- Use `x-session-token` for user-protected endpoints.
- Keep legacy `x-user-id` path disabled by default and only enable for controlled transition.

Why:
- Stronger default security than passing raw user identity headers.
- Minimal implementation complexity compared to full OAuth/OIDC at this stage.
- Better long-term compatibility with web/mobile clients.

Implication:
- Session secret management is mandatory in production.
- Future auth provider integration can sit behind the same user identity boundary.

## D3: Header-Based Admin Key for Local Demo and Early Ops

Decision:
- Use `x-admin-key` for admin endpoints in local/demo mode.
- Reject default key in production mode.

Why:
- Simple and reliable for local prototype operations.
- Keeps admin actions clearly separated from user auth paths.

Implication:
- Production hardening keeps admin boundaries explicit; broader multi-role tenancy is deferred unless scope expands.

## D4: Decimal-Only Money Math

Decision:
- All pricing/totals use Decimal end-to-end.

Why:
- Eliminates floating-point drift for financial calculations.
- Enables deterministic fixture testing.

Implication:
- Frontend submits numeric values as JSON numbers/strings and backend normalizes to Decimal.

## D5: Billing Simulation + OpenRouter-Required LLM

Decision:
- Billing uses a provider-driven runtime: simulation for deterministic local flows and live Stripe when credentials are configured.
- LLM runs through OpenRouter only and fails loud on provider/config/network errors.

Why:
- Full product demo without waiting on payment provider contracts.
- LLM quality and acceptance must match real provider behavior, not local heuristics.

Implication:
- Billing execution is switchable through `REMODELATOR_BILLING_PROVIDER` without route rewrites.
- OpenRouter API key and network availability are required for LLM demo readiness.

## D6: SQLite-First Runtime, Optional PostgreSQL Track

Decision:
- Use SQLite as the default runtime for local/demo and launch baseline.
- Apply SQLite hardening controls (foreign keys, journal mode, synchronous mode, busy timeout) through config.
- Keep PostgreSQL as an optional compatibility track when scale/compliance requires it.

Why:
- Minimal setup and operations complexity.
- Predictable behavior across local/demo/launch environments.
- Maintains a migration path without rewriting domain logic.

Implication:
- Production runbooks must include backup/restore drills and integrity checks.
- If PostgreSQL track is activated later, CI needs dual-backend coverage to prevent drift.

## D7: Web UI is Primary Product Surface, CLI is Operational

Decision:
- Core user workflows must be complete in React UI.
- CLI remains for developer/ops convenience only.

Why:
- Client-facing acceptance depends on complete, non-technical UX.

Implication:
- New core features are not complete until reachable and understandable in UI.

## D8: Thin Route Composition and Feature-Owned UI Logic

Decision:
- Keep `App.tsx` as a thin composition shell.
- Keep data-fetching and action orchestration inside feature pages/hooks backed by typed API modules.

Why:
- Reduces coupling between global route composition and feature behavior.
- Keeps feature slices independently maintainable and testable.

Implication:
- New UI flow wiring should live in feature modules and shared hooks, not in top-level route composition.

## D9: Config-Driven CORS and Baseline Security Headers

Decision:
- Configure CORS allowlist via `REMODELATOR_CORS_ORIGINS`.
- Apply baseline secure response headers from API middleware.

Why:
- Keeps cross-origin behavior explicit per environment.
- Adds low-cost HTTP hardening with no domain-logic coupling.

Implication:
- Production deploy config must set only approved origins.

## D10: Launch Scope Locks (Single-User + Hybrid Billing + Neutral Proposal Content)

Decision:
- Launch account scope is single-user only.
- Billing model is hybrid (`$1200/year` + `$10` per real-time pricing run).
- Proposal branding/legal customization is deferred for prototype (neutral/default template is acceptable).

Why:
- Reduces launch complexity while preserving full core workflow validation.
- Keeps billing semantics explicit without blocking simulation-first testing.
- Avoids UI/content churn before business branding decisions are finalized.

Implication:
- Multi-role/team tenancy remains a post-prototype expansion track.
- Live billing adapter must implement hybrid event semantics exactly.
- Proposal generation pipeline remains technically complete, with content customization as a later layer.

## D11: Built-In Request Tracing and Config-Driven Rate Limiting

Decision:
- Every API response includes `X-Request-ID` for trace correlation.
- API traffic is protected by a sliding-window rate limiter with separate public/authenticated buckets.

Why:
- Improves operability and incident debugging without external infrastructure.
- Adds low-cost abuse protection and predictable API behavior under burst traffic.

Implication:
- Production profiles must tune limit window/bucket env vars to expected traffic envelope.
- Logs can be correlated with client-visible request IDs during support and incident response.

## D12: Billing Simulation Lifecycle Invariants

Decision:
- Enforce transition rules for simulated Stripe-like billing events.
- Reject impossible event sequences with explicit `400` errors.

Why:
- Prevents invalid subscription states from entering the ledger.
- Keeps simulation behavior closer to eventual live-provider semantics.

Implication:
- API/CLI test suites include invalid-transition regression cases.
- Integrators get deterministic failure behavior for out-of-order billing events.

## D13: Unified API Error Envelope

Decision:
- Standardize non-2xx responses to include `detail`, `error{code,message,status}`, and `request_id`.

Why:
- Keeps API/client error handling predictable across auth, validation, business, and dependency failures.
- Improves supportability by correlating user-visible failures with server logs via request ID.

Implication:
- Frontend error parser can consume one envelope shape for all route groups.
- Backward compatibility is preserved via `detail` field.

## D14: Provider-Driven Billing Runtime

Decision:
- Route billing execution through a provider runtime layer instead of directly calling simulation writes.
- Keep `simulation` provider as a deterministic default path.
- Execute `stripe` provider when selected and configured; fail loud on missing/invalid live dependencies.

Why:
- Preserves a clean seam for live billing integration without route-level rewrites.
- Prevents accidental partial-live behavior when Stripe mode is selected without full adapter readiness.

Implication:
- Billing status includes adapter readiness and explicit blocker reason.
- Simulation behavior remains deterministic for local/demo environments.

## D15: Shared Demo Rebuild Path

Decision:
- Centralize demo reset/reseed operations in one service path (`service.rebuild_demo_database`).
- Reuse the same path for API (`POST /admin/demo-reset`) and CLI (`db reset`, `admin demo-reset`).

Why:
- Eliminates duplicate destructive reset logic.
- Keeps local reset behavior consistent across interfaces and reduces drift risk.

Implication:
- Any future reset hardening (locks, retention rules, additional baseline seed data) can be implemented in one place.
- API and CLI reset outputs remain behaviorally aligned.

## D16: Config-Driven Audit Retention Controls

Decision:
- Add `REMODELATOR_AUDIT_RETENTION_DAYS` and expose explicit admin prune operations (`POST /admin/audit-prune`, `admin audit-prune`).

Why:
- Keeps retention behavior deterministic and operationally controllable before final compliance-policy details are locked.
- Avoids hidden/manual DB cleanup steps for long-running deployments.

Implication:
- Compliance blocker is narrowed to policy value/signoff, not implementation feasibility.
- Admin operations can safely purge stale audit rows with explicit retention-window visibility.
- Operators can run non-destructive preview (`dry_run`) before executing retention cleanup.

## D17: Cross-Process Admin Mutation Lock

Decision:
- Protect destructive/admin mutation paths with a cross-process file lock (`operation_lock`), used by demo DB rebuild and audit prune.
- Return `409` conflict when lock acquisition times out.

Why:
- Prevents race conditions between concurrent admin mutation requests (API/CLI).
- Reduces risk of partial reset/prune interleavings on SQLite-backed deployments.

Implication:
- Admin operations become serialized and predictable across processes.
- Lock timeout is configurable via `REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS`.

## D18: Explicit API Shutdown Engine Disposal

Decision:
- Use FastAPI lifespan shutdown to explicitly dispose the SQLAlchemy engine.

Why:
- Makes process teardown deterministic and reduces lingering DB-connection risk.
- Improves operational safety for repeated local/demo restart cycles.

Implication:
- Shutdown path is test-locked (`test_app_shutdown_disposes_engine`).
- API runtime has a clear lifecycle boundary for future resource cleanup additions.

## D19: Single Quality Gate in CI + SQLite Probe Pack

Decision:
- Make CI execute the same end-to-end command used locally (`./scripts/quality_gate.sh`).
- Run a bundled SQLite probe pack (`./scripts/ci_sqlite_probes.sh`) after the quality gate in CI.

Why:
- Prevents local/CI drift and keeps release readiness checks deterministic.
- Ensures SQLite integrity/maintenance/concurrency probes stay continuously executable, not just manual runbook steps.

Implication:
- Any quality gate change must remain CI-safe.
- SQLite operational regressions surface early through CI failure rather than late release-stage checks.

## Open Decisions (External Input Required)

- Final pricing formula confirmation against legacy/client samples.
- Hybrid billing policy details (`$10` trigger/retry/reversal semantics).
- Audit retention/export policy requirements.
- Launch concurrency envelope.
- Written confirmation on legacy credential rotation status (if legacy systems remain active).
