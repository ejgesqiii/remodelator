# API Deployment Assets (Hetzner Ubuntu)

Files:
- `remodelator-api.service.example`: systemd service definition.
- `Caddyfile.example`: HTTPS reverse-proxy template.
- `.env.production.example`: baseline production env template.

Quick usage:
1. Clone repo to `/opt/remodelator/app`.
2. Create venv in `/opt/remodelator/app/.venv` and install deps.
3. Copy `.env.production.example` to `/etc/remodelator/remo-api.env` and fill real secrets.
4. Install systemd service from `remodelator-api.service.example`.
5. Install your reverse-proxy config with your real API domain.
6. Start and enable service:
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now remodelator-api`
7. Validate:
   - `curl -fsS https://api.example.com/health`

Notes:
- The example systemd unit uses `--workers 1` intentionally. For the current single-node SQLite deployment, one worker is the lower-maintenance default and avoids unnecessary write-contention complexity.
- The example service runs the app from the source checkout via `--app-dir /opt/remodelator/app/src`. That avoids package-data drift around static assets and keeps routine deploys to `git pull + restart`.
- The checked-in service example now matches the current live production layout documented in `docs/PRODUCTION_OPERATIONS.md`.
- `Caddyfile.example` remains a generic reverse-proxy reference. The current live deployment uses Nginx; keep the runbook as the source of truth for the deployed host.
- Set `VITE_API_URL` when building the web app for production. If you intend to serve the API from the same origin, set it explicitly to an empty string instead of omitting it.

Operational checks:
- `./scripts/quality_gate.sh`
- `./scripts/ci_sqlite_probes.sh`
- `./scripts/stripe_release_gate.sh --env-file .env.production --api-port 8010`
