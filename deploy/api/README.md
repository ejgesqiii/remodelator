# API Deployment Assets (Hetzner Ubuntu)

Files:
- `remodelator-api.service.example`: systemd service definition.
- `Caddyfile.example`: HTTPS reverse-proxy template.
- `.env.production.example`: baseline production env template.

Quick usage:
1. Copy repo to `/opt/remodelator`.
2. Create venv and install deps.
3. Copy `.env.production.example` to `/opt/remodelator/.env.production` and fill real secrets.
4. Install systemd service from `remodelator-api.service.example`.
5. Install Caddy config from `Caddyfile.example` with your real API domain.
6. Start and enable service:
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now remodelator-api`
7. Validate:
   - `curl -fsS https://api.example.com/health`

Operational checks:
- `./scripts/quality_gate.sh`
- `./scripts/ci_sqlite_probes.sh`
- `./scripts/stripe_release_gate.sh --env-file .env.production --api-port 8010`
