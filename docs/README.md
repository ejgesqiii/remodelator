# Documentation Index

Scope note: active spec sources are root/docs markdown + current code. Historical `notes/*` artifacts are non-authoritative.

## Dependency Setup

Recommended:
```bash
./scripts/bootstrap_local.sh
```

Manual backend setup (Python 3.12+):
```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements-dev.txt
```

Manual web setup:
```bash
npm ci --prefix apps/web
```

## Core Technical Docs

- [Architecture](../ARCHITECTURE.md)
- [Scripts Reference](../scripts/README.md)
- [Technical Decisions](TECH_DECISIONS.md)
- [API Reference](API_REFERENCE.md)
- [Migration Reconciliation Guide](MIGRATION_RECONCILIATION.md)
- [SQLite Operations Runbook](SQLITE_OPERATIONS_RUNBOOK.md)
- [Launch Evidence Checklist](LAUNCH_EVIDENCE_CHECKLIST.md)
- [Deployment Hardening Checklist](DEPLOYMENT_HARDENING_CHECKLIST.md)

## Historical Execution Logs (Reference Only)

- [UI Refactor Plan](../archive/docs/UI_REFACTOR_PLAN_2026-02-25.md)
- [UI/UX Interactions](../archive/docs/UI_UX_INTERACTIONS.md)
- [Blockers and Roadmap](../archive/docs/BLOCKERS_AND_ROADMAP.md)
- [Non-Blocker Completion Scorecard](../archive/docs/NON_BLOCKER_COMPLETION.md)
- [Batch A Taskboard](../archive/docs/BATCH_A_TASKBOARD.md)
- [Batch B Taskboard](../archive/docs/BATCH_B_TASKBOARD.md)
- [Batch A Demo Note](../archive/docs/BATCH_A_DEMO_NOTE.md)

## Generated Docs

- [API Endpoints (Generated)](API_ENDPOINTS_GENERATED.md)

Regenerate:
```bash
python3 scripts/generate_api_endpoints_doc.py
```

Verify sync (CI-safe):
```bash
python3 scripts/generate_api_endpoints_doc.py --check
```
Verify local markdown links (CI-safe):
```bash
python3 scripts/check_markdown_links.py --check --include-archive
```

Run full local quality gate:
```bash
./scripts/quality_gate.sh
```

Run dead/unused-code checks directly:
```bash
./scripts/dead_code_check.sh
```

Capture a timestamped release-evidence bundle:
```bash
./scripts/capture_release_evidence.sh
```
Include live Stripe sandbox/webhook gate in the same bundle:
```bash
./scripts/capture_release_evidence.sh --include-stripe-release-gate --stripe-env-file=.env
```

Bundle outputs include:
- `SUMMARY.md`
- `NON_BLOCKER_STATUS.json`
- quality/docs/sqlite artifact files (`docs_links.log` included)

Show latest bundle readiness quickly:
```bash
./scripts/latest_evidence_status.sh
./scripts/latest_evidence_status.sh --json
```

Rebuild evidence index manually:
```bash
./scripts/evidence_index.sh
```

Prune old evidence bundles (dry run by default):
```bash
./scripts/evidence_prune.sh --keep 20
./scripts/evidence_prune.sh --keep 20 --apply
```

Run SQLite operability probes (mirrors CI probe step):
```bash
./scripts/ci_sqlite_probes.sh
```
Override output locations (useful for ad-hoc runs):
```bash
REMODELATOR_CI_SQLITE_DATA_DIR=/tmp/remodelator_ci_data \
REMODELATOR_CI_OUTPUT_DIR=/tmp/remodelator_ci_outputs \
./scripts/ci_sqlite_probes.sh
```
