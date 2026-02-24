# Batch A Demo Note

Date: February 24, 2026

## 1) What Shipped

1. Frontend modularization:
   - Action modules for auth, workspace, catalog, templates, proposals, billing, LLM, admin.
   - Loader/lifecycle/state hooks for session bootstrap, estimate selection sync, workspace forms, catalog state, profile state, output state, auth state, and session storage.
   - Admin filter bindings and centralized workspace reset orchestration modules with unit tests.
   - LLM readiness gating in UI (OpenRouter required), including explicit blocker messaging.
   - Global fail-loud LLM blocker banner in app shell for immediate operator visibility.
   - `App.tsx` reduced to a thin render shell with orchestration moved into `useAppController`.
   - Further panel decomposition completed for `SessionPanel`, `CatalogPanel`, and `OutputPanel` with dedicated section-level tests.
2. Backend API modularization:
   - Domain routers under `src/remodelator/interfaces/api/routes/*`.
   - Thin API bootstrap in `main.py`.
   - `create_api_app` factory for explicit app assembly.
   - `estimates` route split into `estimates_base` and `estimate_line_items` modules behind stable endpoint contracts.
   - `proposals_billing_llm` route split into dedicated `proposals`, `billing`, and `llm` modules behind stable endpoint contracts.
   - Migration/reconciliation logic extracted from monolithic `service.py` into `application/migration_reconcile.py` with service API compatibility preserved.
   - Estimate/line-item payload serializers extracted into `application/serializers.py` and reused by service flows.
   - Auth/password/session/admin-key logic extracted into `application/auth_security.py` and reused by service/auth dependency paths.
   - LLM status/clamp policy extracted into `application/llm_policy.py`, including configurable max suggestion delta.
   - Strict request contracts (`extra=forbid`) and explicit response models on core health/auth/profile/admin routes.
   - Config-driven list-limit policy (`REMODELATOR_API_LIMIT_MAX`) and shared route constants.
   - Config-driven CORS allowlist and baseline secure response headers at app factory level.
3. Quality hardening:
   - Expanded unit tests for all extracted frontend modules/hooks.
   - API route registration contract test to prevent endpoint surface drift.
   - Router aggregation tests to lock split-router composition (`estimates`, `proposals_billing_llm`) against accidental include loss.
   - Endpoint documentation generation switched to FastAPI route introspection.
   - SQLite foreign-key enforcement + seeding FK-order fix for stronger local/production parity.
   - LLM error semantics hardened to fail loud with `503` dependency responses.
   - API integration tests now use per-run temporary data directories to avoid cross-run state leakage.
   - Playwright HTML report artifacts removed from git tracking to keep source diffs clean.
4. E2E stabilization:
   - Full demo flow hardened by explicitly selecting newly created estimate before editing details.
   - Full demo flow now handles both OpenRouter-ready and OpenRouter-blocked states without false negatives.
5. Frontend maintainability pass:
   - Panel-prop builder modules simplified to typed pass-through adapters.
   - Duplicated panel prop type declarations removed; panel prop types exported at source components.

## 2) What Is Measurably Better

1. `App.tsx` state ownership is now modularized; core behavior moved into dedicated hooks/modules.
2. API architecture is split by domain with cleaner boundaries and no endpoint behavior loss.
3. Regression coverage increased:
   - Frontend tests: 85 passing unit tests.
   - Backend tests: 78 passing tests including route-aggregation, auth-security and llm-policy module coverage, billing-policy/provider-status module coverage, SQLite runtime pragma coverage, CLI SQLite integrity checks, export-path regression coverage, and security-header/CORS guard coverage.
   - E2E: 3/3 passing (smoke, full demo, LLM blocker flow).
4. Billing simulation now includes Stripe-like lifecycle and explicit readiness/status surfaces (`policy`, `provider-status`, `subscription-state`) without requiring live Stripe keys.
5. Docs sync reliability improved by runtime route introspection (no brittle regex parsing of source layout).

## 3) What Remains For Next Batch

1. Product/UX:
   - Final panel-level composition and interaction polish for client walkthrough quality.
2. Domain/API:
   - Pricing fixture lock against client-provided/legacy-validated examples.
   - Additional router-level contract tests and service boundary hardening.
3. Quality/Ops:
   - Finalize launch evidence package (quality-gate artifacts, security confirmations, and operating runbook checks).
   - Continue strict docs/test/e2e gate enforcement.
