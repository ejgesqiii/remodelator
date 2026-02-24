#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_ROOT="$ROOT_DIR/data/evidence"

AS_JSON="false"
for arg in "$@"; do
  case "$arg" in
    --json)
      AS_JSON="true"
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: ./scripts/latest_evidence_status.sh [--json]" >&2
      exit 2
      ;;
  esac
done

if [[ ! -d "$EVIDENCE_ROOT" ]]; then
  echo "No evidence directory found: $EVIDENCE_ROOT" >&2
  exit 1
fi

LATEST_DIR="$(find "$EVIDENCE_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)"
if [[ -z "$LATEST_DIR" ]]; then
  echo "No evidence bundles found under: $EVIDENCE_ROOT" >&2
  exit 1
fi

STATUS_FILE="$LATEST_DIR/NON_BLOCKER_STATUS.json"
if [[ ! -f "$STATUS_FILE" ]]; then
  echo "Missing NON_BLOCKER_STATUS.json in latest bundle: $LATEST_DIR" >&2
  exit 1
fi

if [[ "$AS_JSON" == "true" ]]; then
  python3 - "$LATEST_DIR" "$STATUS_FILE" <<'PY'
import json
import sys
bundle_path = sys.argv[1]
status_file = sys.argv[2]
status = json.loads(open(status_file, "r", encoding="utf-8").read())
payload = {"bundle_path": bundle_path, "status": status}
print(json.dumps(payload, indent=2))
PY
  exit 0
fi

echo "Latest evidence bundle: $LATEST_DIR"
python3 - "$STATUS_FILE" <<'PY'
import json
import sys
status = json.loads(open(sys.argv[1], "r", encoding="utf-8").read())
print(f"non_blocker_gate_status: {status.get('non_blocker_gate_status')}")
print(f"completion_pct: {status.get('completion_pct')}")
checks = status.get("checks", {})
for key in sorted(checks.keys()):
    print(f"{key}: {checks[key]}")
PY
