#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/ci_sqlite_probes.sh

Runs SQLite operability probes and writes artifacts:
  01_migrate.json
  02_seed.json
  03_integrity.json
  04_maintenance.json
  05_envelope.json

Optional environment overrides:
  REMODELATOR_CI_SQLITE_DATA_DIR
  REMODELATOR_CI_OUTPUT_DIR
EOF
  exit 0
fi

CI_DATA_DIR="${REMODELATOR_CI_SQLITE_DATA_DIR:-$ROOT_DIR/data/.ci_sqlite}"
CI_OUT_DIR="${REMODELATOR_CI_OUTPUT_DIR:-$ROOT_DIR/data/.ci_outputs}"

rm -rf "$CI_DATA_DIR" "$CI_OUT_DIR"
mkdir -p "$CI_DATA_DIR" "$CI_OUT_DIR"

export REMODELATOR_DATA_DIR="$CI_DATA_DIR"

remodelator db migrate --json >"$CI_OUT_DIR/01_migrate.json"
remodelator db seed --json >"$CI_OUT_DIR/02_seed.json"
remodelator db integrity-check --json >"$CI_OUT_DIR/03_integrity.json"
remodelator db sqlite-maintenance --json >"$CI_OUT_DIR/04_maintenance.json"
remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 2 --json >"$CI_OUT_DIR/05_envelope.json"

echo "SQLite probe artifacts written to: $CI_OUT_DIR"
