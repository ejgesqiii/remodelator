#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_WEB="true"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/bootstrap_local.sh [--skip-web]

Installs local development dependencies:
1) Python backend deps from requirements-dev.txt
2) Web deps with npm ci (unless --skip-web)
EOF
  exit 0
fi

if [[ "${1:-}" == "--skip-web" ]]; then
  INSTALL_WEB="false"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but was not found." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1 && [[ "$INSTALL_WEB" == "true" ]]; then
  echo "npm is required for web dependency install. Re-run with --skip-web if backend-only." >&2
  exit 1
fi

cd "$ROOT_DIR"

python3 -m pip install --upgrade pip
python3 -m pip install -r requirements-dev.txt

if [[ "$INSTALL_WEB" == "true" ]]; then
  npm ci --prefix apps/web
fi

cat <<'EOF'
Bootstrap complete.
Next steps:
  remodelator db migrate
  remodelator db seed
  ./scripts/run_api.sh
  ./scripts/run_web.sh
EOF
