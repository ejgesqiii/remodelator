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

- [Architecture](/Users/dylan/Documents/remodelator-main/ARCHITECTURE.md)
- [UI Refactor Plan](/Users/dylan/Documents/remodelator-main/UI_REFACTOR_PLAN.md)
- [Scripts Reference](/Users/dylan/Documents/remodelator-main/scripts/README.md)
- [Technical Decisions](/Users/dylan/Documents/remodelator-main/docs/TECH_DECISIONS.md)
- [API Reference](/Users/dylan/Documents/remodelator-main/docs/API_REFERENCE.md)
- [UI/UX Interactions](/Users/dylan/Documents/remodelator-main/docs/UI_UX_INTERACTIONS.md)
- [Migration Reconciliation Guide](/Users/dylan/Documents/remodelator-main/docs/MIGRATION_RECONCILIATION.md)
- [SQLite Operations Runbook](/Users/dylan/Documents/remodelator-main/docs/SQLITE_OPERATIONS_RUNBOOK.md)
- [Deployment Hardening Checklist](/Users/dylan/Documents/remodelator-main/docs/DEPLOYMENT_HARDENING_CHECKLIST.md)
- [Blockers and Roadmap](/Users/dylan/Documents/remodelator-main/docs/BLOCKERS_AND_ROADMAP.md)
- [Non-Blocker Completion Scorecard](/Users/dylan/Documents/remodelator-main/docs/NON_BLOCKER_COMPLETION.md)
- [Launch Evidence Checklist](/Users/dylan/Documents/remodelator-main/docs/LAUNCH_EVIDENCE_CHECKLIST.md)

## Historical Execution Logs (Reference Only)

- [Batch A Taskboard](/Users/dylan/Documents/remodelator-main/docs/BATCH_A_TASKBOARD.md)
- [Batch B Taskboard](/Users/dylan/Documents/remodelator-main/docs/BATCH_B_TASKBOARD.md)
- [Batch A Demo Note](/Users/dylan/Documents/remodelator-main/docs/BATCH_A_DEMO_NOTE.md)

## Generated Docs

- [API Endpoints (Generated)](/Users/dylan/Documents/remodelator-main/docs/API_ENDPOINTS_GENERATED.md)

Regenerate:
```bash
python3 scripts/generate_api_endpoints_doc.py
```

Verify sync (CI-safe):
```bash
python3 scripts/generate_api_endpoints_doc.py --check
```

Run full local quality gate:
```bash
./scripts/quality_gate.sh
```
GitHub CI executes the same gate via [ci.yml](/Users/dylan/Documents/remodelator-main/.github/workflows/ci.yml).
Run dead/unused-code checks directly:
```bash
./scripts/dead_code_check.sh
```

Capture a timestamped release-evidence bundle:
```bash
./scripts/capture_release_evidence.sh
```

Bundle outputs include:
- `SUMMARY.md`
- `NON_BLOCKER_STATUS.json`
- quality/docs/sqlite artifact files

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
