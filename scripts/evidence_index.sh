#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_ROOT="$ROOT_DIR/data/evidence"
mkdir -p "$EVIDENCE_ROOT"

python3 - "$EVIDENCE_ROOT" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(sys.argv[1])
bundles = []
for bundle_dir in sorted([p for p in root.iterdir() if p.is_dir()]):
    status_path = bundle_dir / "NON_BLOCKER_STATUS.json"
    summary_path = bundle_dir / "SUMMARY.md"
    entry = {
        "bundle": bundle_dir.name,
        "path": str(bundle_dir),
        "summary_exists": summary_path.exists(),
        "status_exists": status_path.exists(),
    }
    if status_path.exists():
        try:
            status = json.loads(status_path.read_text(encoding="utf-8"))
            entry["non_blocker_gate_status"] = status.get("non_blocker_gate_status")
            entry["completion_pct"] = status.get("completion_pct")
            entry["generated_at_utc"] = status.get("generated_at_utc")
        except Exception:
            entry["non_blocker_gate_status"] = "invalid"
            entry["completion_pct"] = None
            entry["generated_at_utc"] = None
    bundles.append(entry)

latest_bundle = bundles[-1]["bundle"] if bundles else None
latest_status = bundles[-1].get("non_blocker_gate_status") if bundles else None
latest_completion = bundles[-1].get("completion_pct") if bundles else None

payload = {
    "generated_at_utc": datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
    "count": len(bundles),
    "latest_bundle": latest_bundle,
    "latest_non_blocker_gate_status": latest_status,
    "latest_completion_pct": latest_completion,
    "bundles": bundles,
}
(root / "index.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
print(str(root / "index.json"))
PY
