#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SKIP_QUALITY_GATE="false"
for arg in "$@"; do
  case "$arg" in
    --skip-quality-gate)
      SKIP_QUALITY_GATE="true"
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: ./scripts/capture_release_evidence.sh [--skip-quality-gate]" >&2
      exit 2
      ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="$ROOT_DIR/data/evidence/$STAMP"
mkdir -p "$OUT_DIR"

QUALITY_GATE_STATUS="skipped"
DOCS_SYNC_STATUS="pending"

if [[ "$SKIP_QUALITY_GATE" == "false" ]]; then
  QUALITY_GATE_STATUS="failed"
  if ./scripts/quality_gate.sh >"$OUT_DIR/quality_gate.log" 2>&1; then
    QUALITY_GATE_STATUS="passed"
  fi
fi

DOCS_SYNC_STATUS="failed"
if python3 scripts/generate_api_endpoints_doc.py --check >"$OUT_DIR/docs_sync.log" 2>&1; then
  DOCS_SYNC_STATUS="passed"
fi

remodelator db integrity-check --json >"$OUT_DIR/sqlite_integrity.json"
remodelator db sqlite-maintenance --json >"$OUT_DIR/sqlite_maintenance.json"
remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 2 --json >"$OUT_DIR/sqlite_envelope.json"

SQLITE_INTEGRITY_STATUS="$(python3 - "$OUT_DIR/sqlite_integrity.json" <<'PY'
import json
import sys
payload = json.loads(open(sys.argv[1], "r", encoding="utf-8").read())
status_ok = str(payload.get("status", "")).lower() == "ok"
integrity_ok = str(payload.get("integrity_check", "")).lower() == "ok"
quick_ok = str(payload.get("quick_check", "")).lower() == "ok"
print("passed" if status_ok and integrity_ok and quick_ok else "failed")
PY
)"

SQLITE_MAINTENANCE_STATUS="$(python3 - "$OUT_DIR/sqlite_maintenance.json" <<'PY'
import json
import sys
payload = json.loads(open(sys.argv[1], "r", encoding="utf-8").read())
status_ok = str(payload.get("status", "")).lower() == "ok"
integrity_ok = str(payload.get("integrity_check", "")).lower() == "ok"
quick_ok = str(payload.get("quick_check", "")).lower() == "ok"
print("passed" if status_ok and integrity_ok and quick_ok else "failed")
PY
)"

SQLITE_ENVELOPE_STATUS="$(python3 - "$OUT_DIR/sqlite_envelope.json" <<'PY'
import json
import sys
payload = json.loads(open(sys.argv[1], "r", encoding="utf-8").read())
errors = int(payload.get("errors", 1))
locked_errors = int(payload.get("locked_errors", 1))
print("passed" if errors == 0 and locked_errors == 0 else "failed")
PY
)"

TOTAL_CHECKS=5
PASSED_CHECKS=0
[[ "$QUALITY_GATE_STATUS" == "passed" ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[[ "$DOCS_SYNC_STATUS" == "passed" ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[[ "$SQLITE_INTEGRITY_STATUS" == "passed" ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[[ "$SQLITE_MAINTENANCE_STATUS" == "passed" ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[[ "$SQLITE_ENVELOPE_STATUS" == "passed" ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

NON_BLOCKER_GATE_STATUS="failed"
if [[ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]]; then
  NON_BLOCKER_GATE_STATUS="passed"
elif [[ "$QUALITY_GATE_STATUS" == "skipped" && "$DOCS_SYNC_STATUS" == "passed" && "$SQLITE_INTEGRITY_STATUS" == "passed" && "$SQLITE_MAINTENANCE_STATUS" == "passed" && "$SQLITE_ENVELOPE_STATUS" == "passed" ]]; then
  NON_BLOCKER_GATE_STATUS="partial"
fi

python3 - "$OUT_DIR/NON_BLOCKER_STATUS.json" <<PY
import json
from pathlib import Path

payload = {
  "generated_at_utc": "${STAMP}",
  "non_blocker_gate_status": "${NON_BLOCKER_GATE_STATUS}",
  "checks": {
    "quality_gate": "${QUALITY_GATE_STATUS}",
    "docs_sync": "${DOCS_SYNC_STATUS}",
    "sqlite_integrity": "${SQLITE_INTEGRITY_STATUS}",
    "sqlite_maintenance": "${SQLITE_MAINTENANCE_STATUS}",
    "sqlite_envelope": "${SQLITE_ENVELOPE_STATUS}",
  },
  "passed_checks": ${PASSED_CHECKS},
  "total_checks": ${TOTAL_CHECKS},
  "completion_pct": round((${PASSED_CHECKS} / ${TOTAL_CHECKS}) * 100, 2),
}
Path("$OUT_DIR/NON_BLOCKER_STATUS.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
PY

git rev-parse HEAD >"$OUT_DIR/git_commit.txt"
git status --short >"$OUT_DIR/git_status.txt"
git diff --stat >"$OUT_DIR/git_diff_stat.txt"

cat >"$OUT_DIR/SUMMARY.md" <<EOF
# Release Evidence Bundle

- Generated at (UTC): $STAMP
- Repository root: $ROOT_DIR
- Commit: $(cat "$OUT_DIR/git_commit.txt")
- Quality gate status: $QUALITY_GATE_STATUS
- Docs sync status: $DOCS_SYNC_STATUS
- SQLite integrity status: $SQLITE_INTEGRITY_STATUS
- SQLite maintenance status: $SQLITE_MAINTENANCE_STATUS
- SQLite envelope status: $SQLITE_ENVELOPE_STATUS
- Non-blocker gate status: $NON_BLOCKER_GATE_STATUS ($PASSED_CHECKS/$TOTAL_CHECKS checks)

## Included Artifacts

- \`quality_gate.log\` (present when quality gate was run)
- \`docs_sync.log\`
- \`NON_BLOCKER_STATUS.json\`
- \`sqlite_integrity.json\`
- \`sqlite_maintenance.json\`
- \`sqlite_envelope.json\`
- \`git_commit.txt\`
- \`git_status.txt\`
- \`git_diff_stat.txt\`

## SQLite Envelope Snapshot

\`\`\`json
$(cat "$OUT_DIR/sqlite_envelope.json")
\`\`\`
EOF

EVIDENCE_INDEX_PATH="$(./scripts/evidence_index.sh)"

echo "Evidence bundle written to: $OUT_DIR"
echo "Evidence index updated: $EVIDENCE_INDEX_PATH"

if [[ "$QUALITY_GATE_STATUS" == "failed" ]]; then
  echo "Quality gate failed. See $OUT_DIR/quality_gate.log" >&2
  exit 1
fi

if [[ "$DOCS_SYNC_STATUS" == "failed" ]]; then
  echo "Docs sync check failed. See $OUT_DIR/docs_sync.log" >&2
  exit 1
fi

if [[ "$SQLITE_INTEGRITY_STATUS" == "failed" || "$SQLITE_MAINTENANCE_STATUS" == "failed" || "$SQLITE_ENVELOPE_STATUS" == "failed" ]]; then
  echo "SQLite evidence checks failed. See artifacts in $OUT_DIR" >&2
  exit 1
fi
