# SQLite Operations Runbook

Last updated: February 24, 2026
Scope: local/demo and single-user launch baseline for Remodelator vNext.

## 1) Runtime Profile

Required environment defaults:

```bash
export REMODELATOR_SQLITE_JOURNAL_MODE='WAL'
export REMODELATOR_SQLITE_SYNCHRONOUS='NORMAL'
export REMODELATOR_SQLITE_BUSY_TIMEOUT_MS='5000'
export REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS='10'
```

Why:
1. `WAL` improves read/write concurrency.
2. `NORMAL` reduces fsync overhead while preserving safe durability for this launch profile.
3. Busy-timeout reduces transient lock failures under short write bursts.
4. Operation-lock timeout controls how long admin mutation paths wait before returning a conflict.

## 2) Health Commands

Integrity check:

```bash
remodelator db integrity-check --json
```

Expected:
1. `status=ok`
2. `integrity_check=ok`
3. `quick_check=ok`
4. `foreign_keys=1`

Maintenance cycle:

```bash
remodelator db sqlite-maintenance --json
```

What it performs:
1. `PRAGMA optimize`
2. `ANALYZE`
3. `PRAGMA wal_checkpoint(TRUNCATE)`
4. `VACUUM`
5. post-maintenance integrity and quick checks

Concurrency envelope probe:

```bash
remodelator db sqlite-envelope-test --writers 2 --readers 4 --seconds 5 --json
```

Probe interpretation:
1. `ops_per_second` provides rough throughput under configured busy-timeout and journal settings.
2. `locked_errors` and `lock_error_rate_pct` indicate contention pressure.
3. Tune `REMODELATOR_SQLITE_BUSY_TIMEOUT_MS` and expected concurrency after client launch envelope is confirmed.

Bundled probe pack (same sequence used by CI):

```bash
./scripts/ci_sqlite_probes.sh
```

## 3) Backup and Restore Drill

Prerequisite: authenticated user session (`remodelator auth login ...`).

Backup:

```bash
remodelator db backup --output ./data/remodelator.backup.json --json
```

Restore:

```bash
remodelator db restore --path ./data/remodelator.backup.json --json
```

Drill verification:
1. run backup,
2. run restore,
3. run integrity-check,
4. open web app and verify a known estimate/template still renders as expected.

## 4) Recommended Cadence

For active launch usage:
1. daily: `integrity-check`
2. weekly: `sqlite-maintenance`
3. weekly: `ci_sqlite_probes.sh` snapshot run
4. before releases: full `./scripts/quality_gate.sh`
5. weekly: backup + restore drill

## 5) Incident Recovery (SQLite Mismatch)

If integrity check fails:
1. stop write traffic to API process,
2. snapshot current DB files from `REMODELATOR_DATA_DIR`,
3. run restore from last known-good backup,
4. run integrity-check and smoke tests,
5. resume traffic only after checks are green.
