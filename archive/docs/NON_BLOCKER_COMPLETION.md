# Non-Blocker Completion Scorecard

Last updated: February 24, 2026

Definition used here:
- "Non-blocker completion" means all delivery items that can be completed without pending external client inputs listed in [BLOCKERS_AND_ROADMAP.md](/Users/dylan/Documents/remodelator-main/docs/BLOCKERS_AND_ROADMAP.md).
- This excludes live Stripe cutover semantics, client pricing-signoff truth fixtures, compliance-policy signoffs, and other external confirmations.

## Score

- Status: **100% complete outside blockers**
- Completed items: **20/20**
- Evidence command: `./scripts/capture_release_evidence.sh` (see `NON_BLOCKER_STATUS.json` in each bundle)
- Bundle history index: `./scripts/evidence_index.sh` (writes `data/evidence/index.json`)

## Completed Scope (Outside Blockers)

1. Core UI workflow coverage across Session/Workspace/Catalog/Output/Admin.
   - Evidence: [apps/web/e2e/full-demo.spec.ts](/Users/dylan/Documents/remodelator-main/apps/web/e2e/full-demo.spec.ts)
2. Estimate lifecycle (create/update/status/lock/unlock/duplicate/version).
   - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
3. Estimate quick-start by catalog room.
   - Evidence: [src/remodelator/interfaces/api/routes/estimates_base.py](/Users/dylan/Documents/remodelator-main/src/remodelator/interfaces/api/routes/estimates_base.py)
   - Evidence: [apps/web/src/panels/WorkspacePanel.tsx](/Users/dylan/Documents/remodelator-main/apps/web/src/panels/WorkspacePanel.tsx)
4. Full line-item operations (add/edit/remove/reorder/group).
   - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
5. Deterministic Decimal pricing and recalc.
   - Evidence: [tests/test_pricing.py](/Users/dylan/Documents/remodelator-main/tests/test_pricing.py)
6. Catalog search/tree/upsert/import flows.
   - Evidence: [apps/web/src/panels/CatalogPanel.tsx](/Users/dylan/Documents/remodelator-main/apps/web/src/panels/CatalogPanel.tsx)
7. Templates save/list/apply.
   - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
8. Proposal render + PDF export + estimate JSON export.
   - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
9. Billing simulation with idempotency and lifecycle transitions.
   - Evidence: [tests/test_billing_policy.py](/Users/dylan/Documents/remodelator-main/tests/test_billing_policy.py)
   - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
10. Provider-driven billing runtime seam with fail-loud Stripe mode.
    - Evidence: [src/remodelator/application/billing_runtime.py](/Users/dylan/Documents/remodelator-main/src/remodelator/application/billing_runtime.py)
11. OpenRouter-required LLM with fail-loud behavior and UI blocker states.
    - Evidence: [tests/test_llm_service.py](/Users/dylan/Documents/remodelator-main/tests/test_llm_service.py)
    - Evidence: [apps/web/e2e/llm-blocker.spec.ts](/Users/dylan/Documents/remodelator-main/apps/web/e2e/llm-blocker.spec.ts)
12. Auth hardening (session token, PBKDF2, legacy hash upgrade path).
    - Evidence: [tests/test_auth_security.py](/Users/dylan/Documents/remodelator-main/tests/test_auth_security.py)
13. API security/observability middleware (`X-Request-ID`, rate limiting, secure headers).
    - Evidence: [tests/test_app_factory_security.py](/Users/dylan/Documents/remodelator-main/tests/test_app_factory_security.py)
14. Admin controls (summary/users/activity/billing/demo reset) with mutation lock safety.
    - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
    - Evidence: [tests/test_operation_lock.py](/Users/dylan/Documents/remodelator-main/tests/test_operation_lock.py)
15. Audit retention preview/prune controls in API, CLI, and UI.
    - Evidence: [src/remodelator/interfaces/api/routes/admin.py](/Users/dylan/Documents/remodelator-main/src/remodelator/interfaces/api/routes/admin.py)
16. Snapshot export/restore for local demo resilience.
    - Evidence: [tests/test_api_flow.py](/Users/dylan/Documents/remodelator-main/tests/test_api_flow.py)
17. SQLite reliability tooling (integrity, maintenance, envelope test).
    - Evidence: [docs/SQLITE_OPERATIONS_RUNBOOK.md](/Users/dylan/Documents/remodelator-main/docs/SQLITE_OPERATIONS_RUNBOOK.md)
18. Full quality gate and docs sync passing.
    - Evidence: `./scripts/quality_gate.sh`
    - Evidence: `python3 scripts/generate_api_endpoints_doc.py --check`
19. API endpoint inventory generation and drift checks.
    - Evidence: [docs/API_ENDPOINTS_GENERATED.md](/Users/dylan/Documents/remodelator-main/docs/API_ENDPOINTS_GENERATED.md)
20. Forgot-password explicitly deferred until email delivery exists (scope-accurate UX and docs).
    - Evidence: [apps/web/src/panels/session/AuthFormsSection.tsx](/Users/dylan/Documents/remodelator-main/apps/web/src/panels/session/AuthFormsSection.tsx)
    - Evidence: [README.md](/Users/dylan/Documents/remodelator-main/README.md)

## Remaining To Reach True Launch/Production Signoff

These are external-input blockers and intentionally excluded from the 100% non-blocker score:
1. Pricing formula/client fixture signoff.
2. Hybrid billing live-policy detail signoff.
3. Stripe ownership + key/webhook provisioning window.
4. Audit retention/export compliance signoff values.
5. Launch concurrency envelope target confirmation.
6. Legacy credential-rotation written confirmation.
