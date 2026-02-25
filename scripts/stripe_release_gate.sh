#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env"
API_HOST="127.0.0.1"
API_PORT="8010"
OUTPUT_PATH="data/stripe_release_gate/latest.json"
REUSE_EXISTING_API="false"
KEEP_API_RUNNING="false"

usage() {
  cat <<'EOF'
Usage: ./scripts/stripe_release_gate.sh [options]

Runs Stripe release readiness checks:
1) live Stripe sandbox probe
2) signed webhook golden path against local API
3) consolidated JSON artifact output

Options:
  --env-file <path>        Dotenv file to load (default: .env)
  --api-host <host>        API host to run/target (default: 127.0.0.1)
  --api-port <port>        API port to run/target (default: 8010)
  --output <path>          Consolidated output JSON path
                           (default: data/stripe_release_gate/latest.json)
  --reuse-existing-api     Do not start/stop API process; use provided host/port
  --keep-api-running       If API was started by this script, do not stop it
  -h, --help               Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --api-host)
      API_HOST="$2"
      shift 2
      ;;
    --api-port)
      API_PORT="$2"
      shift 2
      ;;
    --output)
      OUTPUT_PATH="$2"
      shift 2
      ;;
    --reuse-existing-api)
      REUSE_EXISTING_API="true"
      shift
      ;;
    --keep-api-running)
      KEEP_API_RUNNING="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

API_BASE_URL="http://${API_HOST}:${API_PORT}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="$ROOT_DIR/data/stripe_release_gate"
mkdir -p "$LOG_DIR"
API_LOG_PATH="$LOG_DIR/api_${STAMP}.log"
mkdir -p "$(dirname "$OUTPUT_PATH")"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 2
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY must be set in $ENV_FILE." >&2
  exit 2
fi
if [[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "STRIPE_WEBHOOK_SECRET must be set in $ENV_FILE." >&2
  exit 2
fi

API_PID=""
TMP_DATA_DIR=""

cleanup() {
  local code=$?
  if [[ -n "$API_PID" && "$KEEP_API_RUNNING" != "true" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$TMP_DATA_DIR" && -d "$TMP_DATA_DIR" ]]; then
    rm -rf "$TMP_DATA_DIR"
  fi
  return $code
}
trap cleanup EXIT

wait_for_api() {
  local attempts=50
  local delay=0.2
  for ((i=0; i<attempts; i++)); do
    if curl -sf "${API_BASE_URL}/health" >/dev/null; then
      return 0
    fi
    sleep "$delay"
  done
  return 1
}

if [[ "$REUSE_EXISTING_API" != "true" ]]; then
  if command -v lsof >/dev/null 2>&1; then
    if lsof -ti "tcp:${API_PORT}" >/dev/null 2>&1; then
      echo "Port ${API_PORT} is already in use. Use --reuse-existing-api or another --api-port." >&2
      exit 2
    fi
  fi

  TMP_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/remodelator_stripe_gate_XXXXXX")"
  export REMODELATOR_DATA_DIR="$TMP_DATA_DIR/data"
  export REMODELATOR_BILLING_PROVIDER="stripe"
  export REMODELATOR_API_HOST="$API_HOST"
  export REMODELATOR_API_PORT="$API_PORT"
  ./scripts/run_api.sh >"$API_LOG_PATH" 2>&1 &
  API_PID="$!"

  if ! wait_for_api; then
    echo "API failed to start at ${API_BASE_URL}. See ${API_LOG_PATH}" >&2
    exit 1
  fi
fi

python3 scripts/stripe_sandbox_probe.py \
  --env-file "$ENV_FILE" \
  --output "$ROOT_DIR/data/stripe_probe/latest.json"

python3 scripts/stripe_webhook_golden_path.py \
  --env-file "$ENV_FILE" \
  --api-base-url "$API_BASE_URL" \
  --output "$ROOT_DIR/data/stripe_webhook_golden_path/latest.json"

HEALTH_PAYLOAD="$(curl -sf "${API_BASE_URL}/health")"
export HEALTH_PAYLOAD
export API_BASE_URL

python3 - "$OUTPUT_PATH" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

out_path = Path(sys.argv[1])

probe = json.loads(Path("data/stripe_probe/latest.json").read_text(encoding="utf-8"))
golden = json.loads(Path("data/stripe_webhook_golden_path/latest.json").read_text(encoding="utf-8"))
health = json.loads(os.environ["HEALTH_PAYLOAD"])

payload = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "status": "ok",
    "api_base_url": os.environ["API_BASE_URL"],
    "checks": {
        "health_status": health.get("status"),
        "health_db": health.get("db"),
        "sandbox_probe_payment_intent_status": probe.get("payment_intent_status"),
        "sandbox_probe_stripe_api_version_effective": probe.get("stripe_api_version_effective"),
        "webhook_golden_provider": golden.get("provider"),
        "webhook_golden_provider_ready": golden.get("provider_ready"),
        "webhook_golden_subscription_flow": {
            "checkout": golden.get("subscription_status_after_checkout"),
            "invoice_paid": golden.get("subscription_status_after_invoice_paid"),
            "invoice_failed": golden.get("subscription_status_after_invoice_failed"),
            "canceled": golden.get("subscription_status_after_canceled"),
        },
        "webhook_golden_replay_subscription_events": golden.get("replay_subscription_events"),
        "webhook_golden_ledger_event_count": golden.get("ledger_event_count"),
        "webhook_golden_ledger_event_types": golden.get("ledger_event_types"),
    },
    "artifacts": {
        "sandbox_probe": "data/stripe_probe/latest.json",
        "webhook_golden_path": "data/stripe_webhook_golden_path/latest.json",
    },
}

out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(json.dumps({"status": "ok", "output": str(out_path), "result": payload}, indent=2))
PY

echo "Stripe release gate passed."
