# Batch A Taskboard

Last updated: February 24, 2026  
Batch window: 2-3 working days  
Goal: ship parallel progress across Product/UX, Domain/API, and Quality/Ops with green quality gates

## Batch Rules

1. WIP limit: max 2 active tasks per stream.
2. At least 1 completed task per stream before batch close.
3. Blocked tasks move to assumption mode; unblocked tasks continue.
4. Batch closes only when all quality gates pass:
   - `pytest -q`
   - `npm --prefix apps/web test -- --run`
   - `npm --prefix apps/web run build`
   - `npm --prefix apps/web run test:e2e`
   - `python3 scripts/generate_api_endpoints_doc.py --check`

## Stream Board

| ID | Stream | Task | Status | External Dependency | Acceptance Criteria |
|---|---|---|---|---|---|
| A-UX-1 | Product/UX | Extract shared guard/action runner logic from `App.tsx` into reusable module | Done | None | Guard runner module exists, `App.tsx` wired to it, web tests pass |
| A-UX-2 | Product/UX | Split remaining UI action logic into domain hooks (`useEstimateActions`, `useCatalogActions`, `useBillingActions`) | Done | None | Billing/proposal/admin/template/LLM/estimate/catalog action modules extracted; `App.tsx` wired to modules; e2e golden flow passes |
| A-API-1 | Domain/API | Extract API auth dependencies from route file into dedicated module | Done | None | Dependencies module added, routes import it, backend tests pass |
| A-API-2 | Domain/API | Extract API schemas from route file and continue route-layer dedup | Done | None | Schemas module in use, API split into domain routers, endpoint behavior parity verified |
| A-OPS-1 | Quality/Ops | Add focused tests for new guard/dependency modules | Done | None | New targeted tests merged and green in CI gates |
| A-OPS-2 | Quality/Ops | Maintain docs sync and batch execution traceability | Done | None | Generated endpoint check green + taskboard/action-plan references updated |

## Assumption-Mode Tasks (Do Not Block Batch)

| ID | Area | Assumption | Trigger to Replace Assumption |
|---|---|---|---|
| A-AS-1 | Pricing fixtures | Continue deterministic pricing tests with current documented formula order | Client provides confirmed fixture set or real legacy estimate samples |
| A-AS-2 | Migration planning | Legacy migration input is not required for prototype scope; keep tooling as optional future track | Scope explicitly adds legacy data import back into launch path |
| A-AS-3 | Identity model | Single-user launch model is confirmed; keep extension seams for future multi-role scope | Client explicitly expands launch scope to team/org tenancy |

## Batch Close Checklist

- [x] At least 1 task completed in each stream
- [x] No active task exceeds WIP limits
- [x] All quality gates pass
- [x] Short demo note prepared with:
  - what shipped
  - what is measurably better
  - what remains in next batch

## Progress Notes

- Extracted and tested `billingActions` module; wired from `App.tsx`.
- Extracted and tested `proposalActions` module; wired from `App.tsx`.
- Extracted and tested `adminActions` module; wired from `App.tsx`.
- Extracted and tested `templateActions` and `llmActions` modules; wired from `App.tsx`.
- Extracted and tested `estimateActions` module; wired from `App.tsx`.
- Extracted and tested `catalogActions` module; removed duplicate catalog handlers from `App.tsx`.
- Extracted and tested `authActions` module (`register/login/logout`); removed duplicate auth handlers from `App.tsx`.
- Extracted and tested `workspaceActions`, `profileActions`, and `dataLoaders` modules; reduced `App.tsx` orchestration surface and kept behavior parity.
- Extracted lifecycle hooks (`useSessionBootstrap`, `useEstimateSelectionSync`) and form-state hook (`useWorkspaceForms`) to isolate side effects/state from rendering.
- Extracted profile/session persistence hooks (`useProfileState`, `useSessionStorage`) to centralize local state + storage behavior.
- Extracted catalog/template state hook (`useCatalogState`) and reduced panel-state noise in `App.tsx`.
- Extracted auth/LLM/output/core-workspace state hooks and converted panel rendering to prop-composition objects for clearer orchestration.
- Moved active-panel render switch into `components/MainPanels.tsx` to keep `App.tsx` focused on orchestration.
- Split backend API from monolithic route file into domain routers under `src/remodelator/interfaces/api/routes/*` with shared `router_utils`.
- Added `create_api_app` factory and reduced `main.py` to a thin app bootstrap.
- Split `estimates` routing into dedicated modules (`estimates_base`, `estimate_line_items`) while preserving endpoint contracts.
- Split `proposals_billing_llm` routing into dedicated modules (`proposals`, `billing`, `llm`) while preserving endpoint contracts.
- Extracted migration/reconciliation logic from `service.py` into `application/migration_reconcile.py` while preserving public service APIs.
- Extracted estimate/line-item serializers from `service.py` into `application/serializers.py` to reduce service-layer coupling.
- Extracted auth/password/session/admin-key logic from `service.py` into `application/auth_security.py` to keep service orchestration focused on domain workflows.
- Extracted LLM status/clamp policy into `application/llm_policy.py` and added focused module tests.
- Added config-driven SQLite runtime hardening knobs (`journal_mode`, `synchronous`, `busy_timeout`) plus runtime pragma tests.
- Added CLI `db integrity-check` command and coverage for SQLite operational health checks.
- Updated endpoint-doc generator to introspect FastAPI route registry instead of regex-parsing `main.py`.
- Added API route-registration contract test to catch accidental endpoint surface drift during future refactors.
- Added router-aggregation contract tests to lock split-router composition for `estimates` and `proposals_billing_llm`.
- Stabilized Playwright full-demo flow by explicitly selecting the created estimate before opening detail controls.
- Upgraded migration CLI stubs into a real dry-run analyzer (`migrate legacy-sql`) with statement counts, row-level counts, required-column gap detection, column/value mismatch reporting, and optional report output file.
- Extended reconciliation tooling to support snapshot-to-snapshot JSON diff via CLI (`migrate reconcile --source-snapshot ... --migrated-snapshot ...`) with row-count and estimate-total mismatch output.
- Added DB-to-DB reconciliation CLI mode (`migrate reconcile --source-db ... --migrated-db ...`) with row-count, estimate-total, line-count, foreign-key, and orphan checks.
- Converted billing and LLM suggestion UI output to structured cards (typed response models) instead of line-split text rendering.
- Converted admin query rendering to structured cards/lists (summary/users/activity/billing) to remove text-dump output.
- Added RBAC baseline for admin reads: API now allows admin read endpoints via admin-role session token or admin key, while keeping demo reset key-gated.
- Added role-aware admin UX messaging and gating: admin panel now explains access mode and disables actions until valid admin credentials/session are present.
- Added admin query filtering end-to-end (`limit`, user search, user/action/entity filters, billing event filters) for faster operational debugging.
- Tightened API contracts: strict request payloads (`extra=forbid`) and bounded list limits (`1-500`) across audit/catalog/templates/billing/admin list routes.
- Hardened DB engine defaults with `pool_pre_ping` and SQLite foreign-key enforcement; fixed catalog seeding flush order to satisfy FK integrity.
- Added explicit FastAPI response models for health/auth/profile/admin routes so API output contracts stay consistent and self-documenting.
- Removed redundant panel-prop builder wrappers and inlined panel prop assembly in `useAppController.ts` to reduce indirection.
- Converted LLM integration to OpenRouter-required fail-loud behavior (no local fallback path), with UI readiness gating and `503` critical dependency semantics.
- Added global shell-level LLM blocker banner plus dedicated e2e blocker scenario to keep dependency failures visible and test-locked.
- Split orchestration from `App.tsx` into `useAppController` so app-shell rendering and state/action wiring are cleanly separated.
- Decomposed `WorkspacePanel` high-churn sections into focused subcomponents (`LineItemActions`, `LlmPricingAssist`, `EstimateLifecycleActions`) with dedicated tests.
- Extracted admin result rendering into `AdminResultView` to keep `AdminPanel` focused on controls/permissions wiring.
- Decomposed `SessionPanel` into section modules (auth forms, profile defaults, activity/audit, snapshot controls) with focused section tests.
- Decomposed `CatalogPanel` into section modules (catalog management, templates, exports) with focused section tests.
- Decomposed `OutputPanel` into focused billing and proposal section modules with dedicated tests.
- Removed obsolete typed pass-through panel-prop adapters and their tests after inlining equivalent behavior.
- Stabilized API integration test isolation by using a per-run temporary data directory in `tests/test_api_flow.py`.
- Hardened full-demo e2e to support both OpenRouter-ready and OpenRouter-blocked execution paths without flaky failures.
- Hardened Playwright execution for shared SQLite state (`workers=1`, fresh web/API server per run) to eliminate server-reuse flake.
- Added API regression coverage for relative export/PDF output paths to ensure path resolution stays anchored to configured `REMODELATOR_DATA_DIR`.
- Extracted billing policy/provider defaults/validation into `application/billing_policy.py` and wired API/CLI to shared helpers to reduce Stripe-cutover drift risk.
- Added billing provider + subscription lifecycle status surfaces (`/billing/provider-status`, `/billing/subscription-state`) with UI status cards and tests.
- Stopped tracking generated Playwright HTML report artifacts to keep git diffs focused on source changes.
- Added `scripts/quality_gate.sh` to run backend tests, web tests, build, e2e, and docs sync in one command.
- API dependency/schema extraction and tests completed and stable.
- Quality gates green: `pytest -q`, web unit tests, web build, Playwright e2e, and endpoint doc check.

## Proposed Batch B Hand-off

1. Product/UX: admin + billing workflow polish for walkthrough quality.
2. Domain/API: client-validated pricing fixtures and acceptance test lock.
3. Quality/Ops: finalize launch evidence package (quality gate proof, security confirmations, and operating runbook updates).
