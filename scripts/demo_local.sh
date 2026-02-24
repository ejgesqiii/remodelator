#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OUT_DIR="$ROOT_DIR/data/demo_outputs"
mkdir -p "$OUT_DIR"

EMAIL="demo@example.com"
PASSWORD="demo123"

remodelator db reset --json > "$OUT_DIR/01_db_reset.json"

if ! remodelator auth register --email "$EMAIL" --password "$PASSWORD" --name "Demo User" --json > "$OUT_DIR/02_register.json"; then
  remodelator auth login --email "$EMAIL" --password "$PASSWORD" --json > "$OUT_DIR/02_login.json"
fi

ESTIMATE_ID=$(remodelator estimate create --title "Kitchen Refresh" --customer-name "Alice" --job-address "123 Maple Ave" --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

a1=$(remodelator line-item add "$ESTIMATE_ID" --item-name "Countertop Install" --quantity 2 --unit-price 85 --labor-hours 2.5 --group "Kitchen" --json)
a2=$(remodelator line-item add "$ESTIMATE_ID" --item-name "Shower Tile" --quantity 8 --unit-price 14.5 --labor-hours 1.2 --group "Bathroom" --json)

printf '%s\n' "$a1" > "$OUT_DIR/03_line_item_1.json"
printf '%s\n' "$a2" > "$OUT_DIR/04_line_item_2.json"

LINE_ID_2=$(python3 - <<'PY'
import json
from pathlib import Path
payload = json.loads(Path('data/demo_outputs/04_line_item_2.json').read_text())
print(payload['id'])
PY
)

remodelator line-item reorder "$ESTIMATE_ID" "$LINE_ID_2" --new-index 0 --json > "$OUT_DIR/05_reorder.json"
remodelator line-item group "$ESTIMATE_ID" --group "Phase-1" --json > "$OUT_DIR/06_group.json"
remodelator pricing recalc "$ESTIMATE_ID" --json > "$OUT_DIR/07_recalc.json"

SUGGESTED=$(remodelator pricing llm-live --item-name "Countertop Install" --current-unit-price 85 --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["suggested_unit_price"])')
LINE_ID_1=$(python3 - <<'PY'
import json
from pathlib import Path
payload = json.loads(Path('data/demo_outputs/03_line_item_1.json').read_text())
print(payload['id'])
PY
)

remodelator pricing llm-apply "$ESTIMATE_ID" "$LINE_ID_1" --suggested-price "$SUGGESTED" --json > "$OUT_DIR/08_llm_apply.json"
remodelator estimate version "$ESTIMATE_ID" --json > "$OUT_DIR/09_version.json"
remodelator proposal render "$ESTIMATE_ID" --output "$OUT_DIR/proposal.txt" --json > "$OUT_DIR/10_proposal_render.json"
remodelator proposal pdf "$ESTIMATE_ID" --output "$OUT_DIR/proposal.pdf" --json > "$OUT_DIR/11_proposal_pdf.json"
remodelator billing simulate-estimate-charge "$ESTIMATE_ID" --idempotency-key "demo-charge-1" --json > "$OUT_DIR/12_billing_charge.json"
remodelator billing simulate-estimate-charge "$ESTIMATE_ID" --idempotency-key "demo-charge-1" --json > "$OUT_DIR/12b_billing_charge_replay.json"
remodelator estimate export "$ESTIMATE_ID" --output "$OUT_DIR/estimate_export.json" --json > "$OUT_DIR/13_estimate_export_cmd.json"
remodelator audit list --limit 20 --json > "$OUT_DIR/14_audit.json"
remodelator activity report --json > "$OUT_DIR/15_activity.json"
remodelator db backup --output "$OUT_DIR/backup.json" --json > "$OUT_DIR/16_backup_cmd.json"
remodelator admin summary --admin-key "local-admin-key" --json > "$OUT_DIR/17_admin_summary.json"
remodelator admin users --admin-key "local-admin-key" --limit 50 --json > "$OUT_DIR/18_admin_users.json"
remodelator admin activity --admin-key "local-admin-key" --limit 50 --json > "$OUT_DIR/19_admin_activity.json"
remodelator admin billing-ledger --admin-key "local-admin-key" --limit 50 --json > "$OUT_DIR/20_admin_billing.json"
remodelator admin demo-reset --admin-key "local-admin-key" --json > "$OUT_DIR/21_admin_demo_reset.json"

printf 'Demo complete. Estimate ID: %s\nArtifacts: %s\n' "$ESTIMATE_ID" "$OUT_DIR"
