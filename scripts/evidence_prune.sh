#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_ROOT="$ROOT_DIR/data/evidence"

KEEP_COUNT=20
APPLY="false"
AS_JSON="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep)
      KEEP_COUNT="${2:-}"
      shift 2
      ;;
    --apply)
      APPLY="true"
      shift
      ;;
    --json)
      AS_JSON="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: ./scripts/evidence_prune.sh [--keep N] [--apply] [--json]" >&2
      exit 2
      ;;
  esac
done

if ! [[ "$KEEP_COUNT" =~ ^[0-9]+$ ]]; then
  echo "--keep must be a non-negative integer." >&2
  exit 2
fi

mkdir -p "$EVIDENCE_ROOT"

BUNDLES=()
while IFS= read -r dir_path; do
  BUNDLES+=("$dir_path")
done < <(find "$EVIDENCE_ROOT" -mindepth 1 -maxdepth 1 -type d | sort)
TOTAL="${#BUNDLES[@]}"

if (( KEEP_COUNT >= TOTAL )); then
  if [[ "$AS_JSON" == "true" ]]; then
    printf '{\n  "status": "ok",\n  "apply": %s,\n  "keep": %s,\n  "total": %s,\n  "pruned": 0,\n  "candidates": []\n}\n' \
      "$([[ "$APPLY" == "true" ]] && echo true || echo false)" "$KEEP_COUNT" "$TOTAL"
  else
    echo "No evidence bundles to prune (total=$TOTAL, keep=$KEEP_COUNT)."
  fi
  exit 0
fi

PRUNE_COUNT=$((TOTAL - KEEP_COUNT))
CANDIDATES=("${BUNDLES[@]:0:PRUNE_COUNT}")

if [[ "$APPLY" == "true" ]]; then
  for dir_path in "${CANDIDATES[@]}"; do
    rm -rf "$dir_path"
  done
  ./scripts/evidence_index.sh >/dev/null
fi

if [[ "$AS_JSON" == "true" ]]; then
  python3 - "$APPLY" "$KEEP_COUNT" "$TOTAL" "$PRUNE_COUNT" "${CANDIDATES[@]}" <<'PY'
import json
import sys

apply = sys.argv[1].lower() == "true"
keep = int(sys.argv[2])
total = int(sys.argv[3])
prune_count = int(sys.argv[4])
candidates = sys.argv[5:]
payload = {
  "status": "ok",
  "apply": apply,
  "keep": keep,
  "total": total,
  "pruned": prune_count if apply else 0,
  "candidates": candidates,
}
print(json.dumps(payload, indent=2))
PY
else
  if [[ "$APPLY" == "true" ]]; then
    echo "Pruned $PRUNE_COUNT evidence bundle(s). Kept latest $KEEP_COUNT."
  else
    echo "Dry run: $PRUNE_COUNT evidence bundle(s) would be pruned. Kept latest $KEEP_COUNT."
  fi
  printf '%s\n' "${CANDIDATES[@]}"
fi
