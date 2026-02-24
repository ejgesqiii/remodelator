from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def run_cli(args: list[str], env: dict[str, str]) -> dict:
    cmd = [sys.executable, "-m", "remodelator.interfaces.cli.main", *args, "--json"]
    out = subprocess.check_output(cmd, cwd=ROOT, env=env, text=True)
    return json.loads(out)


def run_cli_fail(args: list[str], env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    cmd = [sys.executable, "-m", "remodelator.interfaces.cli.main", *args, "--json"]
    return subprocess.run(cmd, cwd=ROOT, env=env, text=True, capture_output=True, check=False)


def test_cli_end_to_end_local(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    run_cli(["db", "migrate"], env)
    run_cli(["db", "seed"], env)
    run_cli(["auth", "register", "--email", "cli@example.com", "--password", "pw123456", "--name", "CLI Demo"], env)

    estimate = run_cli(
        [
            "estimate",
            "create",
            "--title",
            "CLI Flow",
            "--customer-name",
            "Casey",
        ],
        env,
    )
    estimate_id = estimate["id"]

    quickstarted = run_cli(
        [
            "estimate",
            "quickstart",
            estimate_id,
            "--catalog-node-name",
            "Bathroom",
            "--max-items",
            "2",
        ],
        env,
    )
    assert len(quickstarted["line_items"]) >= 1

    run_cli(
        [
            "line-item",
            "add",
            estimate_id,
            "--item-name",
            "Window Replacement",
            "--quantity",
            "1",
            "--unit-price",
            "420",
            "--group",
            "Windows",
        ],
        env,
    )
    li2 = run_cli(
        [
            "line-item",
            "add",
            estimate_id,
            "--item-name",
            "Drywall Finish",
            "--quantity",
            "4",
            "--unit-price",
            "3.75",
            "--group",
            "Walls",
        ],
        env,
    )

    run_cli(["line-item", "reorder", estimate_id, li2["id"], "--new-index", "0"], env)
    run_cli(["line-item", "group", estimate_id, "--group", "Phase-1"], env)

    shown = run_cli(["estimate", "show", estimate_id], env)
    assert shown["line_items"][0]["id"] == li2["id"]
    assert {item["group_name"] for item in shown["line_items"]} == {"Phase-1"}

    versioned = run_cli(["estimate", "version", estimate_id], env)
    assert versioned["id"] != estimate_id

    export_path = tmp_path / "data" / "estimate_export.json"
    run_cli(["estimate", "export", estimate_id, "--output", str(export_path)], env)
    assert export_path.exists()

    first_charge = run_cli(
        ["billing", "simulate-estimate-charge", estimate_id, "--idempotency-key", "cli-charge-1"],
        env,
    )
    assert first_charge["amount"] == "10.00"
    second_charge = run_cli(
        ["billing", "simulate-estimate-charge", estimate_id, "--idempotency-key", "cli-charge-1"],
        env,
    )
    assert first_charge["billing_event_id"] == second_charge["billing_event_id"]
    assert second_charge["idempotency_status"] == "replayed"

    invalid_usage_event = run_cli_fail(
        ["billing", "simulate-event", "--event-type", "usage_charge", "--details", "usage before subscription"],
        env,
    )
    assert invalid_usage_event.returncode != 0
    assert "Invalid billing lifecycle transition" in invalid_usage_event.stdout

    subscription = run_cli(["billing", "simulate-subscription"], env)
    assert subscription["event_type"] == "subscription"
    assert subscription["amount"] == "1200.00"
    state_active = run_cli(["billing", "subscription-state-show"], env)
    assert state_active["status"] == "active"

    policy = run_cli(["billing", "policy-show"], env)
    assert policy["mode"] == "hybrid"
    assert policy["annual_subscription_amount"] == "1200.00"
    assert policy["realtime_pricing_amount"] == "10.00"
    provider_status = run_cli(["billing", "provider-status-show"], env)
    assert provider_status["provider"] == "simulation"
    assert provider_status["adapter_ready"] is True
    assert provider_status["ready_for_live"] is True
    llm_status = run_cli(["pricing", "llm-status"], env)
    assert llm_status["provider"] == "openrouter"
    assert "ready_for_live" in llm_status

    run_cli(
        [
            "billing",
            "simulate-event",
            "--event-type",
            "subscription_canceled",
            "--details",
            "stripe_sim subscription.canceled subscription_id=sub_cli_001 reason=customer_requested",
        ],
        env,
    )
    state_canceled = run_cli(["billing", "subscription-state-show"], env)
    assert state_canceled["status"] == "canceled"

    summary = run_cli(["admin", "summary", "--admin-key", "local-admin-key"], env)
    assert summary["users"] >= 1
    audit_preview = run_cli(
        ["admin", "audit-prune", "--admin-key", "local-admin-key", "--retention-days", "1", "--dry-run"],
        env,
    )
    assert audit_preview["status"] == "ok"
    assert audit_preview["retention_days"] == 1
    assert audit_preview["dry_run"] is True
    assert isinstance(audit_preview["deleted"], int)

    audit_prune = run_cli(["admin", "audit-prune", "--admin-key", "local-admin-key", "--retention-days", "1"], env)
    assert audit_prune["status"] == "ok"
    assert audit_prune["retention_days"] == 1
    assert audit_prune["dry_run"] is False
    assert isinstance(audit_prune["deleted"], int)


def test_cli_billing_blocks_when_stripe_provider_selected_without_key(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")
    env["REMODELATOR_BILLING_PROVIDER"] = "stripe"
    env.pop("STRIPE_SECRET_KEY", None)

    run_cli(["db", "migrate"], env)
    run_cli(["db", "seed"], env)
    run_cli(
        ["auth", "register", "--email", "stripe-cli@example.com", "--password", "pw123456", "--name", "Stripe CLI"],
        env,
    )

    blocked = run_cli_fail(["billing", "simulate-subscription"], env)
    assert blocked.returncode != 0
    assert "Billing provider 'stripe' is unavailable" in blocked.stdout


def test_cli_db_integrity_check_reports_sqlite_health(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    run_cli(["db", "migrate"], env)
    result = run_cli(["db", "integrity-check"], env)

    assert result["backend"] == "sqlite"
    assert result["status"] == "ok"
    assert result["integrity_check"].lower() == "ok"
    assert result["quick_check"].lower() == "ok"
    assert result["foreign_keys"] == 1
    assert result["busy_timeout_ms"] >= 0

    maintenance = run_cli(["db", "sqlite-maintenance"], env)
    assert maintenance["backend"] == "sqlite"
    assert maintenance["status"] == "ok"
    assert maintenance["integrity_check"].lower() == "ok"
    assert maintenance["quick_check"].lower() == "ok"

    envelope = run_cli(["db", "sqlite-envelope-test", "--writers", "1", "--readers", "1", "--seconds", "1"], env)
    assert envelope["backend"] == "sqlite"
    assert envelope["seconds"] == 1
    assert envelope["writers"] == 1
    assert envelope["readers"] == 1
    assert envelope["total_ops"] >= 1
    assert envelope["errors"] >= envelope["locked_errors"]


def test_cli_pricing_help_hides_deprecated_llm_alias(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    cmd = [sys.executable, "-m", "remodelator.interfaces.cli.main", "pricing", "--help"]
    help_text = subprocess.check_output(cmd, cwd=ROOT, env=env, text=True)

    assert "llm-live" in help_text
    assert "llm-status" in help_text
    assert "llm-simulate" not in help_text


def test_cli_migrate_reconcile_snapshot_diff(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    source = tmp_path / "source_snapshot.json"
    migrated = tmp_path / "migrated_snapshot.json"
    source.write_text('{"estimates":[{"id":"e1","total":"100.00","line_items":[{"id":"l1"}]}]}')
    migrated.write_text('{"estimates":[{"id":"e1","total":"120.00","line_items":[{"id":"l1"}]}]}')

    result = run_cli(
        [
            "migrate",
            "reconcile",
            "--source-snapshot",
            str(source),
            "--migrated-snapshot",
            str(migrated),
        ],
        env,
    )

    assert result["status"] == "mismatch"
    assert "e1" in result["money_total_differences"]


def test_cli_migrate_reconcile_writes_report(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    source = tmp_path / "source_snapshot_report.json"
    migrated = tmp_path / "migrated_snapshot_report.json"
    report = tmp_path / "reconcile_report.json"
    source.write_text('{"estimates":[{"id":"e1","total":"100.00","line_items":[{"id":"l1"}]}]}')
    migrated.write_text('{"estimates":[{"id":"e1","total":"100.00","line_items":[{"id":"l1"}]}]}')

    result = run_cli(
        [
            "migrate",
            "reconcile",
            "--source-snapshot",
            str(source),
            "--migrated-snapshot",
            str(migrated),
            "--report-output",
            str(report),
        ],
        env,
    )

    assert result["status"] == "match"
    assert result["report_output"] == str(report)
    assert report.exists()


def _create_cli_reconcile_db(path: Path, total: str) -> None:
    conn = sqlite3.connect(str(path))
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
        CREATE TABLE estimates (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          total NUMERIC,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE estimate_line_items (
          id TEXT PRIMARY KEY,
          estimate_id TEXT,
          FOREIGN KEY(estimate_id) REFERENCES estimates(id)
        );
        """
    )
    conn.execute("INSERT INTO users (id, email) VALUES ('u1', 'cli@example.com')")
    conn.execute("INSERT INTO estimates (id, user_id, total) VALUES ('e1', 'u1', ?)", (total,))
    conn.execute("INSERT INTO estimate_line_items (id, estimate_id) VALUES ('l1', 'e1')")
    conn.commit()
    conn.close()


def test_cli_migrate_reconcile_db_diff(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    source_db = tmp_path / "source.sqlite3"
    migrated_db = tmp_path / "migrated.sqlite3"
    _create_cli_reconcile_db(source_db, "100.00")
    _create_cli_reconcile_db(migrated_db, "150.00")

    result = run_cli(
        [
            "migrate",
            "reconcile",
            "--source-db",
            str(source_db),
            "--migrated-db",
            str(migrated_db),
        ],
        env,
    )

    assert result["status"] == "mismatch"
    assert result["money_total_differences"]["e1"]["migrated"] == "150.0000"


def test_cli_migrate_reconcile_rejects_mixed_modes(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_DATA_DIR"] = str(tmp_path / "data")

    source_snapshot = tmp_path / "source.json"
    migrated_snapshot = tmp_path / "migrated.json"
    source_db = tmp_path / "source.sqlite3"
    migrated_db = tmp_path / "migrated.sqlite3"
    source_snapshot.write_text("{}")
    migrated_snapshot.write_text("{}")
    source_db.write_text("")
    migrated_db.write_text("")

    proc = run_cli_fail(
        [
            "migrate",
            "reconcile",
            "--source-snapshot",
            str(source_snapshot),
            "--migrated-snapshot",
            str(migrated_snapshot),
            "--source-db",
            str(source_db),
            "--migrated-db",
            str(migrated_db),
        ],
        env,
    )

    assert proc.returncode != 0
    assert "Choose either snapshot mode or DB mode" in proc.stdout
