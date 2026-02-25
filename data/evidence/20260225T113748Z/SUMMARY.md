# Release Evidence Bundle

- Generated at (UTC): 20260225T113748Z
- Repository root: /Users/dylan/Documents/REMO/remodelator
- Commit: ecf4e9d402e30d92b269224e8d365a8ae5a63a7e
- Quality gate status: passed
- Docs sync status: passed
- Docs links status: passed
- SQLite integrity status: passed
- SQLite maintenance status: passed
- SQLite envelope status: passed
- Stripe release gate status: passed
- Non-blocker gate status: passed (7/7 checks)

## Included Artifacts

- `quality_gate.log` (present when quality gate was run)
- `docs_sync.log`
- `docs_links.log`
- `NON_BLOCKER_STATUS.json`
- `sqlite_integrity.json`
- `sqlite_maintenance.json`
- `sqlite_envelope.json`
- `stripe_release_gate.log` (present when stripe release gate is included)
- `stripe_release_gate.json` (present when stripe release gate is included)
- `git_commit.txt`
- `git_status.txt`
- `git_diff_stat.txt`

## SQLite Envelope Snapshot

```json
{
  "backend": "sqlite",
  "seconds": 2,
  "writers": 2,
  "readers": 4,
  "busy_timeout_ms": 5000,
  "reads": 130176,
  "writes": 15339,
  "total_ops": 145515,
  "ops_per_second": 72581.51,
  "errors": 0,
  "locked_errors": 0,
  "lock_error_rate_pct": 0.0
}
```
