#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/run_api.sh

Starts the Remodelator FastAPI server with host/port from env vars:
  REMODELATOR_API_HOST (default: 127.0.0.1)
  REMODELATOR_API_PORT (default: 8000)
EOF
  exit 0
fi

export REMODELATOR_API_HOST="${REMODELATOR_API_HOST:-127.0.0.1}"
export REMODELATOR_API_PORT="${REMODELATOR_API_PORT:-8000}"

exec remodelator-api
