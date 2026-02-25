# Release Evidence Bundle

- Generated at (UTC): 20260225T120346Z
- Repository root: /Users/dylan/Documents/REMO/remodelator
- Commit: 60c0f7f16cd14282bf8ab9b76bb4bd8a156904c0
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
  "reads": 136414,
  "writes": 16342,
  "total_ops": 152756,
  "ops_per_second": 76276.22,
  "errors": 0,
  "locked_errors": 0,
  "lock_error_rate_pct": 0.0
}
```
