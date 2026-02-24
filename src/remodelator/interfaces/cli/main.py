from __future__ import annotations

import json
import sqlite3
import threading
import time
from decimal import Decimal
from pathlib import Path
from typing import Any

import typer
from sqlalchemy.engine import make_url

from remodelator.application import service
from remodelator.application.billing_policy import (
    billing_policy_payload,
    normalize_gateway_event_type,
    resolve_estimate_charge_amount,
    resolve_estimate_charge_details,
    resolve_gateway_event_amount,
    resolve_gateway_event_details,
    resolve_subscription_amount,
    resolve_subscription_details,
)
from remodelator.application.billing_runtime import BillingCommand
from remodelator.application.billing_runtime import execute_billing_command
from remodelator.config import get_settings
from remodelator.infra.db import engine, session_scope
from remodelator.utils.session_state import get_current_user_id, set_current_user_id

app = typer.Typer(help="Remodelator vNext CLI")

auth_app = typer.Typer(help="Authentication commands")
profile_app = typer.Typer(help="Profile commands")
db_app = typer.Typer(help="Database commands")
estimate_app = typer.Typer(help="Estimate commands")
line_item_app = typer.Typer(help="Line item commands")
catalog_app = typer.Typer(help="Catalog commands")
template_app = typer.Typer(help="Template commands")
proposal_app = typer.Typer(help="Proposal commands")
audit_app = typer.Typer(help="Audit commands")
activity_app = typer.Typer(help="Activity commands")
billing_app = typer.Typer(help="Billing simulation commands")
pricing_app = typer.Typer(help="Pricing and LLM commands")
migrate_app = typer.Typer(help="Migration commands")
admin_app = typer.Typer(help="Admin commands")

app.add_typer(db_app, name="db")
app.add_typer(auth_app, name="auth")
app.add_typer(profile_app, name="profile")
app.add_typer(estimate_app, name="estimate")
app.add_typer(line_item_app, name="line-item")
app.add_typer(catalog_app, name="catalog")
app.add_typer(template_app, name="template")
app.add_typer(proposal_app, name="proposal")
app.add_typer(audit_app, name="audit")
app.add_typer(activity_app, name="activity")
app.add_typer(billing_app, name="billing")
app.add_typer(pricing_app, name="pricing")
app.add_typer(migrate_app, name="migrate")
app.add_typer(admin_app, name="admin")


def _emit(payload: Any, as_json: bool) -> None:
    if as_json:
        typer.echo(json.dumps(payload, indent=2, default=str))
        return
    if isinstance(payload, str):
        typer.echo(payload)
        return
    typer.echo(json.dumps(payload, indent=2, default=str))


def _require_logged_in() -> str:
    user_id = get_current_user_id()
    if not user_id:
        raise typer.BadParameter("No active user. Run `remodelator auth login`.")
    return user_id


def _run(action, as_json: bool) -> None:
    try:
        payload = action()
    except Exception as exc:
        typer.secho(f"Error: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc
    _emit(payload, as_json)


def _to_decimal(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def _require_admin_key(key: str) -> None:
    service.verify_admin_key(key)


@db_app.command("migrate")
def db_migrate(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    _run(lambda: service.init_db(), as_json)


@db_app.command("reset")
def db_reset(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    _run(service.rebuild_demo_database, as_json)


@db_app.command("seed")
def db_seed(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            return service.seed_catalog(session)

    _run(action, as_json)


@db_app.command("integrity-check")
def db_integrity_check(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        with engine.connect() as connection:
            backend = connection.dialect.name
            payload: dict[str, Any] = {"backend": backend, "status": "ok"}
            connection.exec_driver_sql("SELECT 1")
            if backend == "sqlite":
                integrity = str(connection.exec_driver_sql("PRAGMA integrity_check").scalar() or "")
                quick = str(connection.exec_driver_sql("PRAGMA quick_check").scalar() or "")
                foreign_keys = int(connection.exec_driver_sql("PRAGMA foreign_keys").scalar() or 0)
                journal_mode = str(connection.exec_driver_sql("PRAGMA journal_mode").scalar() or "")
                synchronous = int(connection.exec_driver_sql("PRAGMA synchronous").scalar() or 0)
                busy_timeout_ms = int(connection.exec_driver_sql("PRAGMA busy_timeout").scalar() or 0)
                payload.update(
                    {
                        "integrity_check": integrity,
                        "quick_check": quick,
                        "foreign_keys": foreign_keys,
                        "journal_mode": journal_mode,
                        "synchronous": synchronous,
                        "busy_timeout_ms": busy_timeout_ms,
                    }
                )
                if integrity.lower() != "ok" or quick.lower() != "ok":
                    payload["status"] = "mismatch"
            return payload

    _run(action, as_json)


@db_app.command("sqlite-maintenance")
def db_sqlite_maintenance(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
            backend = connection.dialect.name
            if backend != "sqlite":
                raise ValueError("db sqlite-maintenance is only supported for SQLite backends.")

            connection.exec_driver_sql("PRAGMA optimize")
            connection.exec_driver_sql("ANALYZE")
            wal_checkpoint = connection.exec_driver_sql("PRAGMA wal_checkpoint(TRUNCATE)").first()
            connection.exec_driver_sql("VACUUM")

            integrity = str(connection.exec_driver_sql("PRAGMA integrity_check").scalar() or "")
            quick = str(connection.exec_driver_sql("PRAGMA quick_check").scalar() or "")
            status = "ok" if integrity.lower() == "ok" and quick.lower() == "ok" else "mismatch"
            return {
                "backend": backend,
                "status": status,
                "integrity_check": integrity,
                "quick_check": quick,
                "wal_checkpoint": list(wal_checkpoint) if wal_checkpoint else [],
            }

    _run(action, as_json)


@db_app.command("sqlite-envelope-test")
def db_sqlite_envelope_test(
    writers: int = typer.Option(2, "--writers", min=1),
    readers: int = typer.Option(4, "--readers", min=1),
    seconds: int = typer.Option(5, "--seconds", min=1),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        settings = get_settings()
        url = make_url(settings.db_url)
        if url.get_backend_name() != "sqlite":
            raise ValueError("db sqlite-envelope-test is only supported for SQLite backends.")
        if not url.database:
            raise ValueError("SQLite database path is missing in REMODELATOR_DB_URL.")

        db_path = str(Path(url.database))
        stop_at = time.monotonic() + seconds
        busy_timeout_ms = settings.sqlite_busy_timeout_ms
        stats_lock = threading.Lock()
        stats = {"reads": 0, "writes": 0, "errors": 0, "locked_errors": 0}

        def _record(key: str) -> None:
            with stats_lock:
                stats[key] += 1

        def reader_worker() -> None:
            conn = sqlite3.connect(db_path, timeout=max(0.1, busy_timeout_ms / 1000), check_same_thread=False)
            conn.execute(f"PRAGMA busy_timeout={busy_timeout_ms}")
            try:
                while time.monotonic() < stop_at:
                    try:
                        conn.execute("SELECT count(*) FROM estimates").fetchone()
                        _record("reads")
                    except sqlite3.OperationalError as exc:
                        if "locked" in str(exc).lower():
                            _record("locked_errors")
                        _record("errors")
            finally:
                conn.close()

        def writer_worker() -> None:
            conn = sqlite3.connect(db_path, timeout=max(0.1, busy_timeout_ms / 1000), check_same_thread=False)
            conn.execute(f"PRAGMA busy_timeout={busy_timeout_ms}")
            try:
                while time.monotonic() < stop_at:
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        conn.execute("SELECT 1").fetchone()
                        conn.execute("COMMIT")
                        _record("writes")
                    except sqlite3.OperationalError as exc:
                        try:
                            conn.execute("ROLLBACK")
                        except Exception:
                            pass
                        if "locked" in str(exc).lower():
                            _record("locked_errors")
                        _record("errors")
            finally:
                conn.close()

        threads = [threading.Thread(target=writer_worker, daemon=True) for _ in range(writers)] + [
            threading.Thread(target=reader_worker, daemon=True) for _ in range(readers)
        ]
        started_at = time.monotonic()
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        elapsed = max(0.001, time.monotonic() - started_at)

        total_ops = stats["reads"] + stats["writes"]
        return {
            "backend": "sqlite",
            "seconds": seconds,
            "writers": writers,
            "readers": readers,
            "busy_timeout_ms": busy_timeout_ms,
            "reads": stats["reads"],
            "writes": stats["writes"],
            "total_ops": total_ops,
            "ops_per_second": round(total_ops / elapsed, 2),
            "errors": stats["errors"],
            "locked_errors": stats["locked_errors"],
            "lock_error_rate_pct": round((stats["locked_errors"] / total_ops) * 100, 4) if total_ops else 0.0,
        }

    _run(action, as_json)


@db_app.command("backup")
def db_backup(
    output: Path = typer.Option(Path("./data/remodelator.backup.json"), "--output", help="Output backup path"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            payload = service.export_user_backup(session, user_id)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(payload, indent=2))
            return {"path": str(output), "estimates": len(payload["estimates"])}

    _run(action, as_json)


@db_app.command("restore")
def db_restore(
    path: Path = typer.Option(Path("./data/remodelator.backup.json"), "--path", help="Backup file path"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        if not path.exists():
            raise ValueError(f"Backup file not found: {path}")
        payload = json.loads(path.read_text())
        with session_scope() as session:
            result = service.restore_user_backup(session, user_id, payload)
            result["path"] = str(path)
            return result

    _run(action, as_json)


@auth_app.command("register")
def auth_register(
    email: str = typer.Option(..., "--email"),
    password: str = typer.Option(..., "--password"),
    name: str = typer.Option("", "--name"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            payload = service.register_user(session, email=email, password=password, full_name=name)
            set_current_user_id(payload["user_id"])
            return payload

    _run(action, as_json)


@auth_app.command("login")
def auth_login(
    email: str = typer.Option(..., "--email"),
    password: str = typer.Option(..., "--password"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        with session_scope() as session:
            payload = service.login_user(session, email=email, password=password)
            set_current_user_id(payload["user_id"])
            return payload

    _run(action, as_json)


@auth_app.command("logout")
def auth_logout(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, str]:
        set_current_user_id(None)
        return {"status": "logged_out"}

    _run(action, as_json)


@profile_app.command("show")
def profile_show(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.get_profile(session, user_id)

    _run(action, as_json)


@profile_app.command("update")
def profile_update(
    name: str | None = typer.Option(None, "--name"),
    labor_rate: float | None = typer.Option(None, "--labor-rate"),
    item_markup_pct: float | None = typer.Option(None, "--item-markup-pct"),
    estimate_markup_pct: float | None = typer.Option(None, "--estimate-markup-pct"),
    tax_rate_pct: float | None = typer.Option(None, "--tax-rate-pct"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.update_profile(
                session=session,
                user_id=user_id,
                full_name=name,
                labor_rate=_to_decimal(labor_rate),
                item_markup_pct=_to_decimal(item_markup_pct),
                estimate_markup_pct=_to_decimal(estimate_markup_pct),
                tax_rate_pct=_to_decimal(tax_rate_pct),
            )

    _run(action, as_json)


@estimate_app.command("create")
def estimate_create(
    title: str = typer.Option(..., "--title"),
    customer_name: str = typer.Option("", "--customer-name"),
    customer_email: str = typer.Option("", "--customer-email"),
    customer_phone: str = typer.Option("", "--customer-phone"),
    job_address: str = typer.Option("", "--job-address"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.create_estimate(
                session,
                user_id=user_id,
                title=title,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                job_address=job_address,
            )

    _run(action, as_json)


@estimate_app.command("list")
def estimate_list(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> list[dict[str, Any]]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.list_estimates(session, user_id)

    _run(action, as_json)


@estimate_app.command("show")
def estimate_show(
    estimate_id: str,
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.get_estimate(session, user_id, estimate_id)

    _run(action, as_json)


@estimate_app.command("update")
def estimate_update(
    estimate_id: str,
    title: str | None = typer.Option(None, "--title"),
    customer_name: str | None = typer.Option(None, "--customer-name"),
    customer_email: str | None = typer.Option(None, "--customer-email"),
    customer_phone: str | None = typer.Option(None, "--customer-phone"),
    job_address: str | None = typer.Option(None, "--job-address"),
    estimate_markup_pct: float | None = typer.Option(None, "--estimate-markup-pct"),
    tax_rate_pct: float | None = typer.Option(None, "--tax-rate-pct"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.update_estimate(
                session,
                user_id,
                estimate_id,
                title,
                customer_name,
                customer_email,
                customer_phone,
                job_address,
                _to_decimal(estimate_markup_pct),
                _to_decimal(tax_rate_pct),
            )

    _run(action, as_json)


@estimate_app.command("duplicate")
def estimate_duplicate(estimate_id: str, as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.duplicate_estimate(session, user_id, estimate_id)

    _run(action, as_json)


@estimate_app.command("version")
def estimate_version(estimate_id: str, as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.create_estimate_version(session, user_id, estimate_id)

    _run(action, as_json)


@estimate_app.command("export")
def estimate_export(
    estimate_id: str,
    output: Path = typer.Option(..., "--output"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.export_estimate_json(session, user_id, estimate_id, output)

    _run(action, as_json)


@estimate_app.command("lock")
def estimate_lock(estimate_id: str, as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.change_estimate_status(session, user_id, estimate_id, "locked")

    _run(action, as_json)


@estimate_app.command("unlock")
def estimate_unlock(estimate_id: str, as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.unlock_estimate(session, user_id, estimate_id)

    _run(action, as_json)


@estimate_app.command("status")
def estimate_status(
    estimate_id: str,
    status: str = typer.Option(..., "--status", help="draft|in_progress|completed|locked"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.change_estimate_status(session, user_id, estimate_id, status)

    _run(action, as_json)


@estimate_app.command("quickstart")
def estimate_quickstart(
    estimate_id: str,
    catalog_node_name: str = typer.Option(..., "--catalog-node-name"),
    max_items: int = typer.Option(5, "--max-items", min=1, max=50),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.quickstart_estimate_from_catalog(
                session=session,
                user_id=user_id,
                estimate_id=estimate_id,
                catalog_node_name=catalog_node_name,
                max_items=max_items,
            )

    _run(action, as_json)


@line_item_app.command("add")
def line_item_add(
    estimate_id: str,
    item_name: str = typer.Option(..., "--item-name"),
    quantity: float = typer.Option(1.0, "--quantity"),
    unit_price: float = typer.Option(0.0, "--unit-price"),
    item_markup_pct: float | None = typer.Option(None, "--item-markup-pct"),
    labor_hours: float = typer.Option(0.0, "--labor-hours"),
    discount_value: float = typer.Option(0.0, "--discount-value"),
    discount_is_percent: bool = typer.Option(False, "--discount-is-percent"),
    group_name: str = typer.Option("General", "--group"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.add_line_item(
                session,
                user_id,
                estimate_id,
                item_name,
                _to_decimal(quantity) or Decimal("0"),
                _to_decimal(unit_price) or Decimal("0"),
                _to_decimal(item_markup_pct),
                _to_decimal(labor_hours) or Decimal("0"),
                _to_decimal(discount_value) or Decimal("0"),
                discount_is_percent,
                group_name,
            )

    _run(action, as_json)


@line_item_app.command("edit")
def line_item_edit(
    estimate_id: str,
    line_item_id: str,
    quantity: float | None = typer.Option(None, "--quantity"),
    unit_price: float | None = typer.Option(None, "--unit-price"),
    item_markup_pct: float | None = typer.Option(None, "--item-markup-pct"),
    labor_hours: float | None = typer.Option(None, "--labor-hours"),
    discount_value: float | None = typer.Option(None, "--discount-value"),
    discount_is_percent: bool | None = typer.Option(None, "--discount-is-percent"),
    group_name: str | None = typer.Option(None, "--group"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.edit_line_item(
                session,
                user_id,
                estimate_id,
                line_item_id,
                _to_decimal(quantity),
                _to_decimal(unit_price),
                _to_decimal(item_markup_pct),
                _to_decimal(labor_hours),
                _to_decimal(discount_value),
                discount_is_percent,
                group_name,
            )

    _run(action, as_json)


@line_item_app.command("remove")
def line_item_remove(
    estimate_id: str,
    line_item_id: str,
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, str]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.remove_line_item(session, user_id, estimate_id, line_item_id)

    _run(action, as_json)


@line_item_app.command("reorder")
def line_item_reorder(
    estimate_id: str,
    line_item_id: str,
    new_index: int = typer.Option(..., "--new-index"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.reorder_line_item(session, user_id, estimate_id, line_item_id, new_index)

    _run(action, as_json)


@line_item_app.command("group")
def line_item_group(
    estimate_id: str,
    group_name: str = typer.Option(..., "--group"),
    line_item_id: str | None = typer.Option(None, "--line-item-id"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.group_line_item(session, user_id, estimate_id, group_name, line_item_id)

    _run(action, as_json)


@catalog_app.command("tree-show")
def catalog_tree_show(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.show_catalog_tree(session)

    _run(action, as_json)


@catalog_app.command("item-search")
def catalog_item_search(
    query: str = typer.Option(..., "--query"),
    limit: int = typer.Option(20, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        with session_scope() as session:
            return service.search_catalog_items(session, query, limit)

    _run(action, as_json)


@catalog_app.command("item-upsert")
def catalog_item_upsert(
    name: str = typer.Option(..., "--name"),
    unit_price: float = typer.Option(..., "--unit-price"),
    labor_hours: float = typer.Option(0.0, "--labor-hours"),
    description: str = typer.Option("", "--description"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.upsert_catalog_item(
                session,
                user_id,
                name,
                _to_decimal(unit_price) or Decimal("0"),
                _to_decimal(labor_hours) or Decimal("0"),
                description,
            )

    _run(action, as_json)


@catalog_app.command("import")
def catalog_import(
    path: Path = typer.Option(..., "--path"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.import_catalog_json(session, user_id, path)

    _run(action, as_json)


@template_app.command("save")
def template_save(
    estimate_id: str,
    name: str = typer.Option(..., "--name"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.save_template_from_estimate(session, user_id, estimate_id, name)

    _run(action, as_json)


@template_app.command("apply")
def template_apply(
    template_id: str,
    estimate_id: str,
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.apply_template_to_estimate(session, user_id, template_id, estimate_id)

    _run(action, as_json)


@proposal_app.command("render")
def proposal_render(
    estimate_id: str,
    output: Path | None = typer.Option(None, "--output"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> Any:
        user_id = _require_logged_in()
        with session_scope() as session:
            text = service.render_proposal_text(session, user_id, estimate_id)
            if output:
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text(text)
                return {"path": str(output)}
            return text

    _run(action, as_json)


@proposal_app.command("pdf")
def proposal_pdf(
    estimate_id: str,
    output: Path | None = typer.Option(None, "--output"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.generate_proposal_pdf(session, user_id, estimate_id, output)

    _run(action, as_json)


@audit_app.command("list")
def audit_list(
    limit: int = typer.Option(50, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.list_audit_events(session, user_id, limit)

    _run(action, as_json)


@activity_app.command("report")
def activity_report(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.activity_report(session, user_id)

    _run(action, as_json)


@billing_app.command("simulate-subscription")
def billing_simulate_subscription(
    amount: float | None = typer.Option(None, "--amount"),
    details: str = typer.Option("", "--details"),
    idempotency_key: str | None = typer.Option(None, "--idempotency-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        settings = get_settings()
        user_id = _require_logged_in()
        with session_scope() as session:
            subscription_amount = resolve_subscription_amount(settings, _to_decimal(amount))
            subscription_details = resolve_subscription_details(details)
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="subscription",
                    amount=subscription_amount,
                    details=subscription_details,
                    idempotency_key=idempotency_key,
                ),
            )

    _run(action, as_json)


@billing_app.command("simulate-estimate-charge")
def billing_simulate_estimate_charge(
    estimate_id: str,
    amount: float | None = typer.Option(None, "--amount"),
    details: str = typer.Option("", "--details"),
    idempotency_key: str | None = typer.Option(None, "--idempotency-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        settings = get_settings()
        user_id = _require_logged_in()
        with session_scope() as session:
            charge_amount = resolve_estimate_charge_amount(settings, _to_decimal(amount))
            details_combined = resolve_estimate_charge_details(estimate_id, details)
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="estimate_charge",
                    amount=charge_amount,
                    details=details_combined,
                    idempotency_key=idempotency_key,
                ),
            )

    _run(action, as_json)


@billing_app.command("simulate-event")
def billing_simulate_event(
    event_type: str = typer.Option(..., "--event-type"),
    amount: float | None = typer.Option(None, "--amount"),
    details: str = typer.Option("", "--details"),
    idempotency_key: str | None = typer.Option(None, "--idempotency-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        settings = get_settings()
        user_id = _require_logged_in()
        event = normalize_gateway_event_type(event_type)
        event_amount = resolve_gateway_event_amount(settings, event, _to_decimal(amount))
        event_details = resolve_gateway_event_details(event, details)
        with session_scope() as session:
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type=event,
                    amount=event_amount,
                    details=event_details,
                    idempotency_key=idempotency_key,
                ),
            )

    _run(action, as_json)


@billing_app.command("simulate-refund")
def billing_simulate_refund(
    amount: float = typer.Option(..., "--amount"),
    details: str = typer.Option("", "--details"),
    idempotency_key: str | None = typer.Option(None, "--idempotency-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            refund_amount = (_to_decimal(amount) or Decimal("0")) * Decimal("-1")
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="refund",
                    amount=refund_amount,
                    details=details,
                    idempotency_key=idempotency_key,
                ),
            )

    _run(action, as_json)


@billing_app.command("policy-show")
def billing_policy_show(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    policy = billing_policy_payload(get_settings())
    _emit(policy, as_json)


@billing_app.command("provider-status-show")
def billing_provider_status_show(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    _emit(service.billing_provider_status(), as_json)


@billing_app.command("subscription-state-show")
def billing_subscription_state_show(
    subscription_id: str | None = typer.Option(None, "--subscription-id"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.subscription_state(session, user_id, subscription_id=subscription_id)

    _run(action, as_json)


@billing_app.command("ledger-show")
def billing_ledger_show(
    limit: int = typer.Option(50, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.list_billing_ledger(session, user_id, limit)

    _run(action, as_json)


@pricing_app.command("recalc")
def pricing_recalc(estimate_id: str, as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.recalc_estimate(session, user_id, estimate_id)

    _run(action, as_json)


def _llm_live_suggestion(item_name: str, current_unit_price: float, context: str) -> dict[str, str]:
    return service.llm_live_price_suggestion(item_name, _to_decimal(current_unit_price) or Decimal("0"), context)


@pricing_app.command("llm-status")
def pricing_llm_status(as_json: bool = typer.Option(False, "--json", help="Output JSON")) -> None:
    _emit(service.llm_provider_status(), as_json)


@pricing_app.command("llm-simulate", hidden=True)
def pricing_llm_simulate(
    item_name: str = typer.Option(..., "--item-name"),
    current_unit_price: float = typer.Option(..., "--current-unit-price"),
    context: str = typer.Option("", "--context"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    # Backward-compatible alias retained; execution is OpenRouter-live only.
    _run(lambda: _llm_live_suggestion(item_name, current_unit_price, context), as_json)


@pricing_app.command("llm-live")
def pricing_llm_live(
    item_name: str = typer.Option(..., "--item-name"),
    current_unit_price: float = typer.Option(..., "--current-unit-price"),
    context: str = typer.Option("", "--context"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    _run(lambda: _llm_live_suggestion(item_name, current_unit_price, context), as_json)


@pricing_app.command("llm-apply")
def pricing_llm_apply(
    estimate_id: str,
    line_item_id: str,
    suggested_price: float = typer.Option(..., "--suggested-price"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        user_id = _require_logged_in()
        with session_scope() as session:
            return service.apply_llm_suggestion_to_line_item(
                session, user_id, estimate_id, line_item_id, _to_decimal(suggested_price) or Decimal("0")
            )

    _run(action, as_json)


@migrate_app.command("legacy-sql")
def migrate_legacy_sql(
    path: Path = typer.Option(..., "--path"),
    report_output: Path | None = typer.Option(None, "--report-output", help="Optional JSON report output path"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        payload = service.migrate_legacy_sql_stub(path)
        if report_output:
            report_output.parent.mkdir(parents=True, exist_ok=True)
            report_output.write_text(json.dumps(payload, indent=2, default=str))
            payload = {**payload, "report_output": str(report_output)}
        return payload

    _run(action, as_json)


@migrate_app.command("reconcile")
def migrate_reconcile(
    source_snapshot: Path | None = typer.Option(None, "--source-snapshot", help="Source JSON snapshot file"),
    migrated_snapshot: Path | None = typer.Option(None, "--migrated-snapshot", help="Migrated JSON snapshot file"),
    source_db: Path | None = typer.Option(None, "--source-db", help="Source SQLite DB file"),
    migrated_db: Path | None = typer.Option(None, "--migrated-db", help="Migrated SQLite DB file"),
    report_output: Path | None = typer.Option(None, "--report-output", help="Optional JSON report output path"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        snapshot_mode = source_snapshot is not None or migrated_snapshot is not None
        db_mode = source_db is not None or migrated_db is not None

        if snapshot_mode and db_mode:
            raise ValueError("Choose either snapshot mode or DB mode, not both.")

        if (source_snapshot is None) != (migrated_snapshot is None):
            raise ValueError("Provide both --source-snapshot and --migrated-snapshot, or neither.")
        if (source_db is None) != (migrated_db is None):
            raise ValueError("Provide both --source-db and --migrated-db, or neither.")

        if source_snapshot and migrated_snapshot:
            payload = service.reconcile_snapshot_files(source_snapshot, migrated_snapshot)
        elif source_db and migrated_db:
            payload = service.reconcile_database_files(source_db, migrated_db)
        else:
            payload = service.reconcile_stub()

        if report_output:
            report_output.parent.mkdir(parents=True, exist_ok=True)
            report_output.write_text(json.dumps(payload, indent=2, default=str))
            payload = {**payload, "report_output": str(report_output)}
        return payload

    _run(action, as_json)


@admin_app.command("summary")
def admin_summary(
    admin_key: str = typer.Option(..., "--admin-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        _require_admin_key(admin_key)
        with session_scope() as session:
            return service.admin_summary(session)

    _run(action, as_json)


@admin_app.command("users")
def admin_users(
    admin_key: str = typer.Option(..., "--admin-key"),
    limit: int = typer.Option(200, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        _require_admin_key(admin_key)
        with session_scope() as session:
            return service.admin_users(session, limit)

    _run(action, as_json)


@admin_app.command("activity")
def admin_activity(
    admin_key: str = typer.Option(..., "--admin-key"),
    limit: int = typer.Option(200, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        _require_admin_key(admin_key)
        with session_scope() as session:
            return service.admin_activity(session, limit)

    _run(action, as_json)


@admin_app.command("billing-ledger")
def admin_billing_ledger(
    admin_key: str = typer.Option(..., "--admin-key"),
    limit: int = typer.Option(200, "--limit"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> list[dict[str, Any]]:
        _require_admin_key(admin_key)
        with session_scope() as session:
            return service.list_billing_ledger_admin(session, limit)

    _run(action, as_json)


@admin_app.command("audit-prune")
def admin_audit_prune(
    admin_key: str = typer.Option(..., "--admin-key"),
    retention_days: int | None = typer.Option(None, "--retention-days", min=1),
    dry_run: bool = typer.Option(False, "--dry-run"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        _require_admin_key(admin_key)
        with session_scope() as session:
            return service.prune_audit_events(session, retention_days=retention_days, dry_run=dry_run)

    _run(action, as_json)


@admin_app.command("demo-reset")
def admin_demo_reset(
    admin_key: str = typer.Option(..., "--admin-key"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON"),
) -> None:
    def action() -> dict[str, Any]:
        _require_admin_key(admin_key)
        return service.rebuild_demo_database()

    _run(action, as_json)


def run() -> None:
    app()


if __name__ == "__main__":
    run()
