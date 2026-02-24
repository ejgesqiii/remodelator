#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/quality_gate.sh

Runs the full local quality gate:
1) backend tests
2) dead-code checks
3) web unit tests
4) web build
5) web e2e tests
6) API endpoint docs sync check
EOF
  exit 0
fi

run_node_cmd() {
  # Some environments set NO_COLOR and FORCE_COLOR together, which emits noisy warnings.
  env -u NO_COLOR NODE_OPTIONS="--localstorage-file=$ROOT_DIR/data/.node_localstorage.json" "$@"
}

echo "[1/6] Backend tests"
cd "$ROOT_DIR"
pytest -q

echo "[2/6] Dead code checks"
./scripts/dead_code_check.sh

echo "[3/6] Web unit tests"
run_node_cmd npm --prefix apps/web test -- --run

echo "[4/6] Web build"
run_node_cmd npm --prefix apps/web run build

echo "[5/6] Web e2e tests"
# Avoid flaky failure when a previous dev/test server is still bound.
if command -v lsof >/dev/null 2>&1; then
  lsof -ti tcp:8000 | xargs -r kill || true
fi
run_node_cmd npm --prefix apps/web run test:e2e

echo "[6/6] Docs sync check"
python3 scripts/generate_api_endpoints_doc.py --check

echo "Quality gate passed."
