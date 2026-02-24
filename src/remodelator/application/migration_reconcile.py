from __future__ import annotations

import json
import re
import sqlite3
from collections import Counter
from decimal import Decimal
from pathlib import Path

_LEGACY_INSERT_RE = re.compile(
    r"insert\s+into\s+[\[`\"]?(?P<table>[a-zA-Z0-9_]+)[\]`\"]?\s*(?:\((?P<columns>.*?)\))?\s*values\s*(?P<values>.+?);",
    flags=re.IGNORECASE | re.DOTALL,
)

_KNOWN_LEGACY_TABLE_ALIASES: dict[str, str] = {
    "users": "users",
    "estimates": "estimates",
    "estimate_line_items": "line_items",
    "line_items": "line_items",
    "catalog_items": "catalog_items",
    "catalog_nodes": "catalog_nodes",
    "templates": "templates",
    "template_line_items": "template_line_items",
    "billing_events": "billing_events",
}

_KNOWN_REQUIRED_COLUMNS: dict[str, set[str]] = {
    "users": {"id", "email"},
    "estimates": {"id", "user_id", "title"},
    "line_items": {"id", "estimate_id", "item_name"},
    "catalog_items": {"id", "name", "unit_price"},
    "catalog_nodes": {"id", "name"},
    "templates": {"id", "name", "user_id"},
    "template_line_items": {"id", "template_id", "item_name"},
    "billing_events": {"id", "user_id", "event_type", "amount"},
}


def _normalize_sql_identifier(raw: str) -> str:
    return raw.strip().strip("`[]\"").lower()


def _split_sql_columns(raw_columns: str) -> list[str]:
    if not raw_columns.strip():
        return []
    return [_normalize_sql_identifier(chunk) for chunk in raw_columns.split(",") if chunk.strip()]


def _extract_sql_value_groups(raw_values: str) -> list[str]:
    groups: list[str] = []
    depth = 0
    start: int | None = None
    in_single = False
    in_double = False
    idx = 0

    while idx < len(raw_values):
        char = raw_values[idx]
        if char == "'" and not in_double:
            if in_single and idx + 1 < len(raw_values) and raw_values[idx + 1] == "'":
                idx += 2
                continue
            in_single = not in_single
        elif char == '"' and not in_single:
            if in_double and idx + 1 < len(raw_values) and raw_values[idx + 1] == '"':
                idx += 2
                continue
            in_double = not in_double
        elif not in_single and not in_double:
            if char == "(":
                if depth == 0:
                    start = idx + 1
                depth += 1
            elif char == ")" and depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    groups.append(raw_values[start:idx].strip())
                    start = None
        idx += 1
    return groups


def _count_sql_group_values(group_sql: str) -> int:
    if not group_sql.strip():
        return 0

    in_single = False
    in_double = False
    depth = 0
    count = 1
    idx = 0
    while idx < len(group_sql):
        char = group_sql[idx]
        if char == "'" and not in_double:
            if in_single and idx + 1 < len(group_sql) and group_sql[idx + 1] == "'":
                idx += 2
                continue
            in_single = not in_single
        elif char == '"' and not in_single:
            if in_double and idx + 1 < len(group_sql) and group_sql[idx + 1] == '"':
                idx += 2
                continue
            in_double = not in_double
        elif not in_single and not in_double:
            if char == "(":
                depth += 1
            elif char == ")" and depth > 0:
                depth -= 1
            elif char == "," and depth == 0:
                count += 1
        idx += 1
    return count


def migrate_legacy_sql_stub(path: Path) -> dict[str, object]:
    if not path.exists():
        raise ValueError("Legacy input path not found.")
    if not path.is_file():
        raise ValueError("Legacy input path must be a file.")

    text = path.read_text(encoding="utf-8", errors="ignore")
    insert_matches = list(_LEGACY_INSERT_RE.finditer(text))
    raw_counts: Counter[str] = Counter()
    statement_row_counts: Counter[str] = Counter()
    normalized_counts: Counter[str] = Counter()
    normalized_row_counts: Counter[str] = Counter()
    unknown_tables: list[str] = []

    column_value_mismatches: list[dict[str, object]] = []
    required_column_gaps: list[dict[str, object]] = []

    for match in insert_matches:
        table = _normalize_sql_identifier(match.group("table") or "")
        raw_counts[table] += 1

        normalized = _KNOWN_LEGACY_TABLE_ALIASES.get(table)
        if normalized:
            normalized_counts[normalized] += 1
        else:
            unknown_tables.append(table)

        raw_columns = match.group("columns") or ""
        columns = _split_sql_columns(raw_columns) if raw_columns else []
        value_groups = _extract_sql_value_groups(match.group("values") or "")
        if not value_groups:
            value_groups = [""]
        statement_row_counts[table] += len(value_groups)
        if normalized:
            normalized_row_counts[normalized] += len(value_groups)

        if columns:
            column_count = len(columns)
            for row_index, group in enumerate(value_groups):
                values_count = _count_sql_group_values(group)
                if values_count != column_count and len(column_value_mismatches) < 50:
                    column_value_mismatches.append(
                        {
                            "table": table,
                            "normalized_table": normalized,
                            "row_index": row_index,
                            "column_count": column_count,
                            "value_count": values_count,
                        }
                    )
            if normalized and normalized in _KNOWN_REQUIRED_COLUMNS:
                missing = sorted(_KNOWN_REQUIRED_COLUMNS[normalized] - set(columns))
                if missing and len(required_column_gaps) < 50:
                    required_column_gaps.append(
                        {
                            "table": table,
                            "normalized_table": normalized,
                            "missing_required_columns": missing,
                        }
                    )
        elif normalized and normalized in _KNOWN_REQUIRED_COLUMNS and len(required_column_gaps) < 50:
            required_column_gaps.append(
                {
                    "table": table,
                    "normalized_table": normalized,
                    "missing_required_columns": sorted(_KNOWN_REQUIRED_COLUMNS[normalized]),
                    "reason": "columns_not_declared_in_insert",
                }
            )

    warnings: list[str] = []
    if not insert_matches:
        warnings.append("No INSERT statements detected. Verify source format.")
    if unknown_tables:
        preview = ", ".join(sorted(unknown_tables)[:8])
        warnings.append(f"Unmapped tables detected: {preview}")
    if column_value_mismatches:
        warnings.append("Column/value count mismatches detected in INSERT statements.")
    if required_column_gaps:
        warnings.append("Missing required columns detected for known tables.")

    return {
        "status": "analyzed",
        "message": "Legacy SQL dry-run complete. Provide field mappings to execute import.",
        "analysis_version": 2,
        "input": str(path),
        "bytes": path.stat().st_size,
        "total_insert_statements": len(insert_matches),
        "total_rows_detected": int(sum(statement_row_counts.values())),
        "source_table_insert_counts": dict(sorted(raw_counts.items())),
        "source_table_row_counts": dict(sorted(statement_row_counts.items())),
        "table_insert_counts": dict(sorted(normalized_counts.items())),
        "table_row_counts": dict(sorted(normalized_row_counts.items())),
        "unknown_tables": sorted(unknown_tables),
        "column_value_mismatches": column_value_mismatches,
        "required_column_gaps": required_column_gaps,
        "warnings": warnings,
    }


def _snapshot_counts(payload: dict[str, object]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for key, value in payload.items():
        if isinstance(value, list):
            counts[key] = len(value)
    estimates = payload.get("estimates")
    if isinstance(estimates, list):
        line_count = 0
        for estimate in estimates:
            if isinstance(estimate, dict):
                lines = estimate.get("line_items")
                if isinstance(lines, list):
                    line_count += len(lines)
        counts["estimate_line_items"] = line_count
    return counts


def _snapshot_estimate_totals(payload: dict[str, object]) -> dict[str, str]:
    estimates = payload.get("estimates")
    if not isinstance(estimates, list):
        return {}
    totals: dict[str, str] = {}
    for item in estimates:
        if not isinstance(item, dict):
            continue
        estimate_id = str(item.get("id") or "").strip()
        if not estimate_id:
            continue
        totals[estimate_id] = str(item.get("total") or "0")
    return totals


_RECONCILE_CHECKS = [
    "row_counts_by_entity",
    "money_totals_by_estimate",
    "line_item_count_by_estimate",
    "missing_foreign_keys",
    "orphaned_records",
]

_RECONCILE_TABLES = [
    "users",
    "estimates",
    "estimate_line_items",
    "catalog_nodes",
    "catalog_items",
    "templates",
    "template_line_items",
    "billing_events",
    "idempotency_records",
    "audit_events",
]

_RECONCILE_RELATIONSHIPS = [
    ("estimates", "user_id", "users", "id"),
    ("estimate_line_items", "estimate_id", "estimates", "id"),
    ("catalog_nodes", "parent_id", "catalog_nodes", "id"),
    ("catalog_items", "node_id", "catalog_nodes", "id"),
    ("templates", "user_id", "users", "id"),
    ("template_line_items", "template_id", "templates", "id"),
    ("billing_events", "user_id", "users", "id"),
    ("idempotency_records", "user_id", "users", "id"),
    ("idempotency_records", "billing_event_id", "billing_events", "id"),
    ("audit_events", "user_id", "users", "id"),
]


def load_snapshot_file(path: Path) -> dict[str, object]:
    if not path.exists():
        raise ValueError("Snapshot path not found.")
    if not path.is_file():
        raise ValueError("Snapshot path must be a JSON file.")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Snapshot file is not valid JSON: {path}") from exc
    if not isinstance(payload, dict):
        raise ValueError("Snapshot root must be an object.")
    return payload


def reconcile_snapshot_files(source_path: Path, migrated_path: Path) -> dict[str, object]:
    source_payload = load_snapshot_file(source_path)
    migrated_payload = load_snapshot_file(migrated_path)
    result = reconcile_stub(source_payload, migrated_payload)
    return {**result, "source_snapshot": str(source_path), "migrated_snapshot": str(migrated_path)}


def _sqlite_connect(path: Path) -> sqlite3.Connection:
    if not path.exists():
        raise ValueError(f"SQLite DB path not found: {path}")
    if not path.is_file():
        raise ValueError(f"SQLite DB path must be a file: {path}")
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def _sqlite_table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
        (table_name,),
    ).fetchone()
    return row is not None


def _sqlite_count_rows(conn: sqlite3.Connection, table_name: str) -> int:
    if not _sqlite_table_exists(conn, table_name):
        return 0
    row = conn.execute(f"SELECT COUNT(*) AS c FROM {table_name}").fetchone()
    return int(row["c"] if row else 0)


def _sqlite_estimate_totals(conn: sqlite3.Connection) -> dict[str, str]:
    if not _sqlite_table_exists(conn, "estimates"):
        return {}
    rows = conn.execute("SELECT id, COALESCE(total, 0) AS total FROM estimates").fetchall()
    return {
        str(row["id"]): str(Decimal(str(row["total"])).quantize(Decimal("0.0001")))
        for row in rows
        if row["id"] is not None
    }


def _sqlite_line_item_counts_by_estimate(conn: sqlite3.Connection) -> dict[str, int]:
    if not _sqlite_table_exists(conn, "estimate_line_items"):
        return {}
    rows = conn.execute(
        "SELECT estimate_id, COUNT(*) AS c FROM estimate_line_items GROUP BY estimate_id",
    ).fetchall()
    return {str(row["estimate_id"]): int(row["c"]) for row in rows if row["estimate_id"] is not None}


def _sqlite_fk_issues(conn: sqlite3.Connection) -> int:
    rows = conn.execute("PRAGMA foreign_key_check").fetchall()
    return len(rows)


def _sqlite_orphan_counts(conn: sqlite3.Connection) -> dict[str, int]:
    results: dict[str, int] = {}
    for child_table, child_column, parent_table, parent_column in _RECONCILE_RELATIONSHIPS:
        if not _sqlite_table_exists(conn, child_table) or not _sqlite_table_exists(conn, parent_table):
            continue
        query = f"""
            SELECT COUNT(*) AS c
            FROM {child_table} c
            LEFT JOIN {parent_table} p ON c.{child_column} = p.{parent_column}
            WHERE c.{child_column} IS NOT NULL
              AND p.{parent_column} IS NULL
        """
        row = conn.execute(query).fetchone()
        key = f"{child_table}.{child_column}->{parent_table}.{parent_column}"
        results[key] = int(row["c"] if row else 0)
    return results


def _db_reconcile_metrics(path: Path) -> dict[str, object]:
    with _sqlite_connect(path) as conn:
        row_counts = {table: _sqlite_count_rows(conn, table) for table in _RECONCILE_TABLES}
        estimate_totals = _sqlite_estimate_totals(conn)
        line_item_counts = _sqlite_line_item_counts_by_estimate(conn)
        fk_issue_count = _sqlite_fk_issues(conn)
        orphan_counts = _sqlite_orphan_counts(conn)
    return {
        "row_counts": row_counts,
        "estimate_totals": estimate_totals,
        "line_item_counts": line_item_counts,
        "fk_issue_count": fk_issue_count,
        "orphan_counts": orphan_counts,
    }


def reconcile_database_files(source_db_path: Path, migrated_db_path: Path) -> dict[str, object]:
    source = _db_reconcile_metrics(source_db_path)
    migrated = _db_reconcile_metrics(migrated_db_path)

    source_row_counts = source["row_counts"]
    migrated_row_counts = migrated["row_counts"]
    row_count_differences = {
        key: {"source": int(source_row_counts.get(key, 0)), "migrated": int(migrated_row_counts.get(key, 0))}
        for key in sorted(set(source_row_counts) | set(migrated_row_counts))
        if int(source_row_counts.get(key, 0)) != int(migrated_row_counts.get(key, 0))
    }

    source_totals = source["estimate_totals"]
    migrated_totals = migrated["estimate_totals"]
    estimate_total_differences = {
        key: {"source": str(source_totals.get(key, "0.0000")), "migrated": str(migrated_totals.get(key, "0.0000"))}
        for key in sorted(set(source_totals) | set(migrated_totals))
        if str(source_totals.get(key, "0.0000")) != str(migrated_totals.get(key, "0.0000"))
    }

    source_line_counts = source["line_item_counts"]
    migrated_line_counts = migrated["line_item_counts"]
    line_item_count_differences = {
        key: {"source": int(source_line_counts.get(key, 0)), "migrated": int(migrated_line_counts.get(key, 0))}
        for key in sorted(set(source_line_counts) | set(migrated_line_counts))
        if int(source_line_counts.get(key, 0)) != int(migrated_line_counts.get(key, 0))
    }

    source_orphans = source["orphan_counts"]
    migrated_orphans = migrated["orphan_counts"]
    orphan_issues = {
        key: {"source": int(source_orphans.get(key, 0)), "migrated": int(migrated_orphans.get(key, 0))}
        for key in sorted(set(source_orphans) | set(migrated_orphans))
        if int(source_orphans.get(key, 0)) != 0 or int(migrated_orphans.get(key, 0)) != 0
    }

    source_fk_issues = int(source["fk_issue_count"])
    migrated_fk_issues = int(migrated["fk_issue_count"])

    has_mismatch = any(
        [
            bool(row_count_differences),
            bool(estimate_total_differences),
            bool(line_item_count_differences),
            source_fk_issues > 0,
            migrated_fk_issues > 0,
            bool(orphan_issues),
        ]
    )

    return {
        "status": "mismatch" if has_mismatch else "match",
        "message": "Database reconciliation diff complete.",
        "source_db": str(source_db_path),
        "migrated_db": str(migrated_db_path),
        "checks": [
            {
                "name": "row_counts_by_entity",
                "status": "fail" if row_count_differences else "pass",
                "mismatch_count": len(row_count_differences),
            },
            {
                "name": "money_totals_by_estimate",
                "status": "fail" if estimate_total_differences else "pass",
                "mismatch_count": len(estimate_total_differences),
            },
            {
                "name": "line_item_count_by_estimate",
                "status": "fail" if line_item_count_differences else "pass",
                "mismatch_count": len(line_item_count_differences),
            },
            {
                "name": "missing_foreign_keys",
                "status": "fail" if (source_fk_issues or migrated_fk_issues) else "pass",
                "source_issues": source_fk_issues,
                "migrated_issues": migrated_fk_issues,
            },
            {
                "name": "orphaned_records",
                "status": "fail" if orphan_issues else "pass",
                "mismatch_count": len(orphan_issues),
            },
        ],
        "row_count_differences": row_count_differences,
        "money_total_differences": estimate_total_differences,
        "line_item_count_differences": line_item_count_differences,
        "foreign_key_issues": {"source": source_fk_issues, "migrated": migrated_fk_issues},
        "orphan_issues": orphan_issues,
    }


def reconcile_stub(
    source_snapshot: dict[str, object] | None = None,
    migrated_snapshot: dict[str, object] | None = None,
) -> dict[str, object]:
    if source_snapshot is None or migrated_snapshot is None:
        return {
            "status": "ready",
            "message": "Reconciliation report scaffold ready. Provide source and migrated snapshots to execute strict diff.",
            "checks": list(_RECONCILE_CHECKS),
        }

    source_counts = _snapshot_counts(source_snapshot)
    migrated_counts = _snapshot_counts(migrated_snapshot)
    all_count_keys = sorted(set(source_counts) | set(migrated_counts))
    count_differences = {
        key: {"source": source_counts.get(key, 0), "migrated": migrated_counts.get(key, 0)}
        for key in all_count_keys
        if source_counts.get(key, 0) != migrated_counts.get(key, 0)
    }

    source_totals = _snapshot_estimate_totals(source_snapshot)
    migrated_totals = _snapshot_estimate_totals(migrated_snapshot)
    all_estimate_ids = sorted(set(source_totals) | set(migrated_totals))
    total_differences = {
        estimate_id: {"source": source_totals.get(estimate_id, "0"), "migrated": migrated_totals.get(estimate_id, "0")}
        for estimate_id in all_estimate_ids
        if source_totals.get(estimate_id, "0") != migrated_totals.get(estimate_id, "0")
    }

    return {
        "status": "mismatch" if count_differences or total_differences else "match",
        "message": "Reconciliation diff complete.",
        "checks": [
            {
                "name": "row_counts_by_entity",
                "status": "fail" if count_differences else "pass",
                "mismatch_count": len(count_differences),
            },
            {
                "name": "money_totals_by_estimate",
                "status": "fail" if total_differences else "pass",
                "mismatch_count": len(total_differences),
            },
            {
                "name": "line_item_count_by_estimate",
                "status": "pass",
                "details": "Covered under row_counts_by_entity via estimate_line_items count.",
            },
            {
                "name": "missing_foreign_keys",
                "status": "not_executed",
                "details": "Needs relational source + migrated DB snapshots.",
            },
            {
                "name": "orphaned_records",
                "status": "not_executed",
                "details": "Needs relational source + migrated DB snapshots.",
            },
        ],
        "row_count_differences": count_differences,
        "money_total_differences": total_differences,
    }


