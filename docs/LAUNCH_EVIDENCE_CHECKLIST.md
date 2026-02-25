# Launch Evidence Checklist

Last updated: February 25, 2026

Purpose: map each production-readiness deliverable to verifiable evidence (tests, commands, docs, or runtime artifacts).

## 1) Core Workflow Coverage

- [x] Register/login/profile workflow works in UI.
  - Evidence: `apps/web/e2e/full-demo.spec.ts`
- [x] Estimate lifecycle and line-item operations are complete in UI.
  - Evidence: `apps/web/e2e/full-demo.spec.ts`
  - Evidence: `tests/test_api_flow.py`
- [x] Templates, proposal render/PDF, and export flow work end-to-end.
  - Evidence: `apps/web/e2e/full-demo.spec.ts`
  - Evidence: `tests/test_api_flow.py`

## 2) Financial Correctness + Billing Safety

- [x] Deterministic Decimal pricing behavior is test-locked.
  - Evidence: `tests/test_pricing.py`
  - Evidence: `tests/fixtures/pricing_canonical_fixtures.json`
- [x] Billing idempotency replay is verified.
  - Evidence: `tests/test_api_flow.py`
  - Evidence: `tests/test_cli_flow.py`
- [x] Billing lifecycle transition rules reject invalid event order.
  - Evidence: `tests/test_billing_policy.py`
  - Evidence: `tests/test_api_flow.py`
  - Evidence: `tests/test_cli_flow.py`

## 3) Auth and Security Baseline

- [x] Session-token auth path is enforced and legacy header is disabled by default.
  - Evidence: `tests/test_api_dependencies.py`
  - Evidence: `src/remodelator/config.py`
- [x] Password hashing and legacy hash upgrade path are covered.
  - Evidence: `tests/test_auth_security.py`
  - Evidence: `tests/test_auth_security_module.py`
- [x] Admin gates are enforced for sensitive actions.
  - Evidence: `tests/test_api_flow.py`
  - Evidence: `tests/test_api_dependencies.py`
- [x] Secure response headers are present.
  - Evidence: `tests/test_app_factory_security.py`

## 4) Observability + Abuse Controls

- [x] Request tracing header (`X-Request-ID`) is returned for API responses.
  - Evidence: `tests/test_app_factory_security.py`
  - Evidence: `src/remodelator/interfaces/api/app_factory.py`
- [x] Config-driven API rate limiting is enforced.
  - Evidence: `tests/test_app_factory_security.py`
  - Evidence: `src/remodelator/interfaces/api/app_factory.py`
- [x] Structured request logs include request ID and status.
  - Evidence: `src/remodelator/interfaces/api/app_factory.py`

## 5) Data Reliability (SQLite Launch Baseline)

- [x] SQLite foreign keys/journal/synchronous/busy-timeout runtime knobs are active.
  - Evidence: `src/remodelator/infra/db.py`
  - Evidence: `src/remodelator/config.py`
  - Evidence: `docs/SQLITE_OPERATIONS_RUNBOOK.md`
- [x] Integrity check command validates runtime DB health.
  - Evidence: `tests/test_db_sqlite_runtime.py`
  - Command: `remodelator db integrity-check --json`
- [x] SQLite maintenance workflow is executable and verified.
  - Evidence: `tests/test_cli_flow.py`
  - Command: `remodelator db sqlite-maintenance --json`
- [x] SQLite concurrency envelope probe is executable for launch tuning.
  - Evidence: `tests/test_cli_flow.py`
  - Command: `remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 5 --json`
- [x] One-command SQLite operability probe pack exists for CI/local reproducibility.
  - Command: `./scripts/ci_sqlite_probes.sh`
  - Output artifact path: `data/.ci_outputs/`
- [x] Backup/restore flow is verifiable.
  - Evidence: `tests/test_api_flow.py`
  - Evidence: `tests/test_cli_flow.py`

## 6) LLM + External Dependency Policy

- [x] LLM is OpenRouter-only and fail-loud.
  - Evidence: `tests/test_llm_service.py`
  - Evidence: `apps/web/e2e/llm-blocker.spec.ts`
- [x] LLM provider status is exposed for UI/ops diagnostics.
  - Evidence: `tests/test_llm_policy.py`
  - Evidence: `src/remodelator/interfaces/api/routes/llm.py`

## 7) Quality Gate Evidence

- [x] Full quality gate passes.
  - Command: `./scripts/quality_gate.sh`
  - Output artifact: attach latest run log/screenshot to release note.
- [x] API endpoint doc sync passes.
  - Command: `python3 scripts/generate_api_endpoints_doc.py --check`
- [x] Timestamped evidence bundle can be generated in one command.
  - Command: `./scripts/capture_release_evidence.sh`
  - Output artifact path: `data/evidence/<UTC_TIMESTAMP>/`
  - Includes machine-readable non-blocker status file: `NON_BLOCKER_STATUS.json`
- [x] Stripe sandbox release gate (probe + webhook golden path) is verifiable.
  - Command: `./scripts/stripe_release_gate.sh --env-file .env --api-port 8010`
  - Output artifact path: `data/stripe_release_gate/latest.json`
- [x] Evidence index for bundle history can be regenerated.
  - Command: `./scripts/evidence_index.sh`
  - Output artifact path: `data/evidence/index.json`

## 8) Deployment Hardening Evidence

- [ ] Deployment hardening checklist is completed for target environment.
  - Evidence: `docs/DEPLOYMENT_HARDENING_CHECKLIST.md`

## 9) Blocker-Bound Finalization Items

These remain intentionally external until client input is provided:

1. Pricing formula/fixtures validation against client-provided known outputs.
2. Hybrid billing live-policy lock (`$10` trigger/retry/reversal/cancel semantics).
3. Stripe ownership + keys/webhooks provisioning for live adapter cutover.
4. Compliance retention/export policy confirmation.
5. Legacy credential-rotation written confirmation.
