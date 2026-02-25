# Scripts Reference

Last updated: February 25, 2026

This directory contains the authoritative local/CI automation entrypoints.

## Quickstart Flow

1. Bootstrap dependencies:
   - `./scripts/bootstrap_local.sh`
2. Start API:
   - `./scripts/run_api.sh`
3. Start web app:
   - `./scripts/run_web.sh`
4. Run full quality gate:
   - `./scripts/quality_gate.sh`
5. Capture release evidence:
   - `./scripts/capture_release_evidence.sh`

## Script Index

- `bootstrap_local.sh`
  - Installs Python deps (`requirements-dev.txt`) and web deps (`npm ci`).
  - Use `--skip-web` for backend-only setup.
- `run_api.sh`
  - Starts FastAPI (`remodelator-api`) with `REMODELATOR_API_HOST/PORT`.
  - API startup performs safe local SQLite schema init/backfill before serving requests.
- `run_web.sh`
  - Starts Vite web app on `127.0.0.1:5173`.
  - Runs `npm ci` only when `apps/web/node_modules` is missing.
- `quality_gate.sh`
  - Runs backend tests, dead-code checks, web tests/build/e2e, API doc sync, and markdown link-integrity checks.
- `dead_code_check.sh`
  - Runs `ruff check src tests`.
  - Runs TypeScript no-unused checks (`tsc --noUnusedLocals --noUnusedParameters`).
- `capture_release_evidence.sh`
  - Runs quality/docs/sqlite checks and writes timestamped bundle under `data/evidence/`.
  - Supports `--include-stripe-release-gate` and `--stripe-env-file=.env` to append live Stripe sandbox/webhook verification.
- `check_markdown_links.py`
  - Validates local markdown links in active docs (`root/*.md`, `docs/*.md`, `scripts/README.md`, `apps/web/README.md`).
  - Use `--check` to fail on broken links.
  - Use `--include-archive` to validate `archive/docs/*.md` links too.
- `ci_sqlite_probes.sh`
  - Runs SQLite migrate/seed/integrity/maintenance/envelope probes.
  - Writes artifacts to `data/.ci_outputs/` by default.
  - Supports `REMODELATOR_CI_SQLITE_DATA_DIR` and `REMODELATOR_CI_OUTPUT_DIR`.
- `generate_api_endpoints_doc.py`
  - Generates `docs/API_ENDPOINTS_GENERATED.md` from FastAPI route registry.
  - `--check` mode fails on drift.
- `evidence_index.sh`
  - Rebuilds `data/evidence/index.json`.
- `latest_evidence_status.sh`
  - Shows latest evidence bundle status (`--json` supported).
- `evidence_prune.sh`
  - Prunes old evidence bundles (`--keep`, `--apply`, `--json`).
- `demo_local.sh`
  - CLI-driven end-to-end local demo artifact generator in `data/demo_outputs/`.
- `stripe_sandbox_probe.py`
  - Runs a live Stripe test-mode probe using `STRIPE_SECRET_KEY` (and optional `STRIPE_API_VERSION`).
  - Captures sanitized raw response evidence to `data/stripe_probe/latest.json`.
- `stripe_webhook_golden_path.py`
  - Runs a signed Stripe webhook lifecycle against a running API (`/billing/webhook` + state/ledger checks).
  - Captures run evidence to `data/stripe_webhook_golden_path/latest.json`.
- `stripe_release_gate.sh`
  - Runs sandbox probe + signed webhook golden path + health checks in one pass.
  - Writes consolidated release artifact to `data/stripe_release_gate/latest.json`.
