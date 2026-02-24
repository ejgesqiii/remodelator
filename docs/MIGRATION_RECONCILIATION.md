# Migration Reconciliation Guide

Last updated: February 24, 2026

This guide describes the local migration validation tooling for Remodelator vNext.

## 1) Legacy SQL Dry-Run

Command:

```bash
remodelator migrate legacy-sql --path ./legacy.sql --report-output ./data/migration_report.json --json
```

What it checks:
- total INSERT statement count
- total row count parsed from INSERT value groups
- source table insert/row counts
- mapped table insert/row counts
- unknown/unmapped table names
- column/value count mismatches in INSERT rows
- required-column gaps for known mapped tables

Key output fields:
- `table_row_counts`
- `unknown_tables`
- `column_value_mismatches`
- `required_column_gaps`
- `warnings`

## 2) Snapshot Reconciliation (JSON)

Command:

```bash
remodelator migrate reconcile \
  --source-snapshot ./data/source_snapshot.json \
  --migrated-snapshot ./data/migrated_snapshot.json \
  --report-output ./data/reconcile_snapshot_report.json \
  --json
```

What it checks:
- row-count differences by top-level entity list
- estimate total differences by estimate ID
- derived estimate-line-item count differences

## 3) Database Reconciliation (SQLite)

Command:

```bash
remodelator migrate reconcile \
  --source-db ./data/source.sqlite3 \
  --migrated-db ./data/migrated.sqlite3 \
  --report-output ./data/reconcile_db_report.json \
  --json
```

What it checks:
- row-count differences across core tables
- estimate total differences (`estimates.total`) by estimate ID
- line-item count differences by estimate ID
- foreign key integrity via `PRAGMA foreign_key_check`
- orphan relationships across core FK pairs

Key output fields:
- `row_count_differences`
- `money_total_differences`
- `line_item_count_differences`
- `foreign_key_issues`
- `orphan_issues`

## 4) Operational Notes

- `--report-output` writes machine-readable JSON suitable for signoff artifacts.
- Use snapshot mode when source systems cannot provide raw DB files.
- Use DB mode for stronger integrity checks before cutover rehearsal.
- Reconciliation can validate structure and totals but cannot resolve business-rule intent mismatches without client pricing fixture confirmation.
