from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from remodelator.application import service


def test_migrate_legacy_sql_stub_analyzes_insert_counts(tmp_path: Path) -> None:
    sql = """
    INSERT INTO users (id,email) VALUES ('1','a@example.com'), ('2','b@example.com');
    insert into estimates (id,title) values ('e1','Kitchen');
    INSERT INTO estimate_line_items (id,estimate_id) VALUES ('l1','e1');
    INSERT INTO legacy_custom_table (id) VALUES ('x1');
    """
    source = tmp_path / "legacy.sql"
    source.write_text(sql)

    payload = service.migrate_legacy_sql_stub(source)

    assert payload["status"] == "analyzed"
    assert payload["analysis_version"] == 2
    assert payload["total_insert_statements"] == 4
    assert payload["total_rows_detected"] == 5
    assert payload["table_insert_counts"] == {"estimates": 1, "line_items": 1, "users": 1}
    assert payload["table_row_counts"] == {"estimates": 1, "line_items": 1, "users": 2}
    assert payload["unknown_tables"] == ["legacy_custom_table"]
    assert payload["warnings"]
    assert payload["required_column_gaps"]


def test_migrate_legacy_sql_stub_detects_column_value_mismatch(tmp_path: Path) -> None:
    sql = "INSERT INTO users (id,email) VALUES ('1');"
    source = tmp_path / "legacy_mismatch.sql"
    source.write_text(sql)

    payload = service.migrate_legacy_sql_stub(source)

    assert payload["column_value_mismatches"]
    mismatch = payload["column_value_mismatches"][0]
    assert mismatch["table"] == "users"
    assert mismatch["column_count"] == 2
    assert mismatch["value_count"] == 1


def test_migrate_legacy_sql_stub_requires_file(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="must be a file"):
        service.migrate_legacy_sql_stub(tmp_path)


def test_reconcile_stub_has_expected_checks() -> None:
    payload = service.reconcile_stub()

    assert payload["status"] == "ready"
    assert "row_counts_by_entity" in payload["checks"]


def test_reconcile_stub_compares_snapshots() -> None:
    source = {
        "estimates": [{"id": "e1", "total": "100.00", "line_items": [{"id": "l1"}]}],
        "users": [{"id": "u1"}],
    }
    migrated = {
        "estimates": [{"id": "e1", "total": "120.00", "line_items": [{"id": "l1"}, {"id": "l2"}]}],
        "users": [{"id": "u1"}],
    }

    payload = service.reconcile_stub(source, migrated)

    assert payload["status"] == "mismatch"
    assert payload["row_count_differences"]["estimate_line_items"]["source"] == 1
    assert payload["money_total_differences"]["e1"]["migrated"] == "120.00"


def test_reconcile_snapshot_files(tmp_path: Path) -> None:
    source_path = tmp_path / "source.json"
    migrated_path = tmp_path / "migrated.json"
    source_path.write_text('{"estimates":[{"id":"e1","total":"100.00","line_items":[]}]}')
    migrated_path.write_text('{"estimates":[{"id":"e1","total":"100.00","line_items":[]}]}')

    payload = service.reconcile_snapshot_files(source_path, migrated_path)

    assert payload["status"] == "match"
    assert payload["source_snapshot"] == str(source_path)


def _create_reconcile_test_db(path: Path, *, estimate_total: str, orphan_line: bool = False) -> None:
    conn = sqlite3.connect(str(path))
    conn.executescript(
        """
        PRAGMA foreign_keys = OFF;
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
    conn.execute("INSERT INTO users (id, email) VALUES ('u1', 'u1@example.com')")
    conn.execute("INSERT INTO estimates (id, user_id, total) VALUES ('e1', 'u1', ?)", (estimate_total,))
    conn.execute("INSERT INTO estimate_line_items (id, estimate_id) VALUES ('l1', 'e1')")
    if orphan_line:
        conn.execute("INSERT INTO estimate_line_items (id, estimate_id) VALUES ('l-orphan', 'missing-estimate')")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.commit()
    conn.close()


def test_reconcile_database_files_match(tmp_path: Path) -> None:
    source_db = tmp_path / "source.sqlite3"
    migrated_db = tmp_path / "migrated.sqlite3"
    _create_reconcile_test_db(source_db, estimate_total="100.00")
    _create_reconcile_test_db(migrated_db, estimate_total="100.00")

    payload = service.reconcile_database_files(source_db, migrated_db)

    assert payload["status"] == "match"
    assert payload["row_count_differences"] == {}
    assert payload["money_total_differences"] == {}
    assert payload["foreign_key_issues"]["source"] == 0
    assert payload["foreign_key_issues"]["migrated"] == 0


def test_reconcile_database_files_detects_mismatch_and_orphans(tmp_path: Path) -> None:
    source_db = tmp_path / "source_mismatch.sqlite3"
    migrated_db = tmp_path / "migrated_mismatch.sqlite3"
    _create_reconcile_test_db(source_db, estimate_total="100.00")
    _create_reconcile_test_db(migrated_db, estimate_total="120.00", orphan_line=True)

    payload = service.reconcile_database_files(source_db, migrated_db)

    assert payload["status"] == "mismatch"
    assert payload["money_total_differences"]["e1"]["source"] == "100.0000"
    assert payload["money_total_differences"]["e1"]["migrated"] == "120.0000"
    assert payload["foreign_key_issues"]["migrated"] >= 1
    assert payload["orphan_issues"]
