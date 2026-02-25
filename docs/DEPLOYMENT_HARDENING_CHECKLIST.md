# Deployment Hardening Checklist

Last updated: February 25, 2026
Scope: production deployment baseline (Stripe integration validated in sandbox; production cutover remains credential/ops-driven).

## 1) Environment and Secrets

- [ ] Set `REMODELATOR_ENV=production`.
- [ ] Set a strong `REMODELATOR_SESSION_SECRET`.
- [ ] Set a non-default `REMODELATOR_ADMIN_API_KEY`.
- [ ] Keep `REMODELATOR_ALLOW_LEGACY_USER_HEADER=false`.
- [ ] Set explicit `REMODELATOR_CORS_ORIGINS`.
- [ ] Set OpenRouter credentials and model config for required LLM flows.
- [ ] Set billing provider mode intentionally (`simulation` or `stripe`).
- [ ] If `stripe` mode is enabled, set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_API_VERSION`
  - `STRIPE_PAYMENT_RETURN_URL`
- [ ] Set `REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS` to a launch-safe admin mutation timeout.

## 2) API Runtime Security

- [ ] Verify response security headers are present in production.
- [ ] Verify `X-Request-ID` is returned on all responses.
- [ ] Verify rate limiting is enabled and tuned with launch-safe defaults.
- [ ] Verify auth/admin failures return standardized error envelope payloads.
- [ ] Verify admin-read vs admin-mutation auth behavior:
  - read routes: admin session or admin key
  - destructive routes: `x-admin-key` required

## 3) SQLite Runtime Safety

- [ ] Confirm SQLite runtime knobs:
  - `REMODELATOR_SQLITE_JOURNAL_MODE=WAL`
  - `REMODELATOR_SQLITE_SYNCHRONOUS=NORMAL`
  - `REMODELATOR_SQLITE_BUSY_TIMEOUT_MS=5000` (or tuned)
- [ ] Run `remodelator db integrity-check --json`.
- [ ] Run `remodelator db sqlite-maintenance --json`.
- [ ] Run `remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 5 --json`.
- [ ] Run bundled SQLite probe pack `./scripts/ci_sqlite_probes.sh`.
- [ ] Run backup + restore drill (`db backup` / `db restore`).

## 4) Release Verification

- [x] Run `./scripts/quality_gate.sh` on release candidate.
- [x] Run `python3 scripts/generate_api_endpoints_doc.py --check`.
- [x] Run `python3 scripts/check_markdown_links.py --check --include-archive`.
- [x] Generate timestamped release evidence bundle:
  - `./scripts/capture_release_evidence.sh --include-stripe-release-gate --stripe-env-file=.env`
- [x] Verify Stripe sandbox release gate:
  - `./scripts/stripe_release_gate.sh --env-file .env --api-port 8010`
- [ ] Run an end-to-end business demo flow in web UI and capture release note evidence.
- [ ] Verify admin reset + audit prune preview/execute workflow against production profile constraints.

## 5) Operational Readiness

- [ ] Ensure structured logs are shipped/retained per org policy.
- [ ] Attach latest launch evidence packet:
  - `docs/LAUNCH_EVIDENCE_CHECKLIST.md`
  - `docs/SQLITE_OPERATIONS_RUNBOOK.md`
  - `docs/DEPLOYMENT_HARDENING_CHECKLIST.md`
  - latest evidence bundle summary (`data/evidence/<timestamp>/SUMMARY.md`)
- [ ] Record outstanding external blockers and owner/ETA before go-live decision.
