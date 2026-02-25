# Deployment Hardening Checklist

Last updated: February 24, 2026
Scope: production-ready deployment baseline (excluding external blocker inputs).

## 1) Environment and Secrets

- [ ] Set `REMODELATOR_ENV=production`.
- [ ] Set a strong `REMODELATOR_SESSION_SECRET`.
- [ ] Set a non-default `REMODELATOR_ADMIN_API_KEY`.
- [ ] Keep `REMODELATOR_ALLOW_LEGACY_USER_HEADER=false`.
- [ ] Set explicit `REMODELATOR_CORS_ORIGINS`.
- [ ] Set OpenRouter credentials and model config for required LLM flows.
- [ ] Set billing provider mode (`simulation` until live Stripe cutover is approved).
- [ ] Set `REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS` to a launch-safe admin mutation timeout.

## 2) API Runtime Security

- [ ] Verify response security headers are present in production.
- [ ] Verify `X-Request-ID` is returned on all responses.
- [ ] Verify rate limiting is enabled and tuned with launch-safe defaults.
- [ ] Verify auth/admin failures return standardized error envelope payloads.

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

- [x] Run `./scripts/quality_gate.sh` on release commit.
- [x] Run `python3 scripts/generate_api_endpoints_doc.py --check`.
- [x] Generate timestamped release evidence bundle.
  - Command: `./scripts/capture_release_evidence.sh`
- [ ] Run an end-to-end demo flow in web UI and capture release note evidence.
- [ ] Verify admin reset workflow and baseline reseed behavior.

## 5) Operational Readiness

- [ ] Ensure structured logs are shipped/retained per org policy.
- [ ] Attach latest launch evidence packet:
  - `docs/LAUNCH_EVIDENCE_CHECKLIST.md`
  - `docs/SQLITE_OPERATIONS_RUNBOOK.md`
  - quality gate output snapshot.
- [ ] Record outstanding external blockers and owner/ETA before go-live decision.
