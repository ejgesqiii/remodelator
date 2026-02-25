#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/run_web.sh

Starts the Vite web app at http://127.0.0.1:5173.
- Installs dependencies with `npm ci` only when node_modules is missing.
EOF
  exit 0
fi

cd "$(dirname "$0")/../apps/web"

if [[ ! -d node_modules ]]; then
  npm ci
fi

npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
