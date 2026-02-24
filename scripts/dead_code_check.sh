#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/dead_code_check.sh

Runs dead/unused-code checks:
1) Python lint checks (ruff) for src/tests
2) TypeScript no-unused checks for web app
EOF
  exit 0
fi

cd "$ROOT_DIR"
ruff check src tests

cd "$ROOT_DIR/apps/web"
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
