# Release Evidence Bundle

- Generated at (UTC): 20260225T112629Z
- Repository root: /Users/dylan/Documents/REMO/remodelator
- Commit: ecf4e9d402e30d92b269224e8d365a8ae5a63a7e
- Quality gate status: passed
- Docs sync status: passed
- SQLite integrity status: passed
- SQLite maintenance status: passed
- SQLite envelope status: passed
- Stripe release gate status: passed
- Non-blocker gate status: passed (6/6 checks)

## Included Artifacts

- `quality_gate.log` (present when quality gate was run)
- `docs_sync.log`
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
  "reads": 125387,
  "writes": 15200,
  "total_ops": 140587,
  "ops_per_second": 70079.46,
  "errors": 0,
  "locked_errors": 0,
  "lock_error_rate_pct": 0.0
}
```
