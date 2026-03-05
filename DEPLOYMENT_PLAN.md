# Deployment Plan (Firebase Web + Hetzner API)

Date: March 5, 2026  
Target: low-maintenance, resilient deployment for a modest-load SaaS

## 1) Recommended Topology

- Web app (static SPA): Firebase Hosting
  - initial domain: `PROJECT_ID.web.app` / `PROJECT_ID.firebaseapp.com`
  - later: custom domain (recommended)
- API: Hetzner Ubuntu VM
  - FastAPI app behind reverse proxy (Caddy or Nginx)
  - HTTPS enabled for API endpoint
- Database: SQLite on local VM disk (single-node)

This is a valid setup for your current product stage and expected traffic.

## 2) Is This Architecture OK?

Yes, for your current scope it is a good fit:
- low ops burden,
- cheap,
- easy rollback,
- already aligned with your code and test suite.

For high write concurrency / multi-instance scale, plan PostgreSQL later.

## 3) What Must Be Ready Before Production

## Mandatory unblockers

1. Domain + DNS
- API domain (example: `api.remodelator.app`) pointing to Hetzner VM.
- Web can start on Firebase temp domain, but custom domain is strongly recommended before real launch.

2. TLS / HTTPS
- API must be HTTPS.
- Stripe live webhooks require HTTPS endpoint.

3. Production env values
- `REMODELATOR_ENV=production`
- strong `REMODELATOR_SESSION_SECRET`
- strong `REMODELATOR_ADMIN_API_KEY`
- `REMODELATOR_CORS_ORIGINS` set to your Firebase/custom frontend domain(s)
- `REMODELATOR_BILLING_PROVIDER=stripe` (or keep simulation intentionally)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PAYMENT_RETURN_URL=https://<your-web-domain>/billing?stripe_return=1`
- `REMODELATOR_PUBLIC_PROPOSAL_TTL_SECONDS` (recommended: `900` to `3600`)

4. Password reset delivery decision (currently deferred)
- Either implement email/SMS delivery, or keep forgot-password disabled/hidden in production.

## 4) Step-by-Step Rollout Plan

## Phase A: Firebase web deploy (fast)

1. Create Firebase project (e.g., `remodelator`).
2. Build web app: `npm --prefix apps/web run build`
3. Initialize hosting config in repo: `firebase init hosting`
4. Set public directory to `apps/web/dist`, configure SPA rewrite to `index.html`.
5. Deploy: `firebase deploy --only hosting`
6. Capture Firebase domain(s) and add to API CORS env.

## Phase B: Hetzner API deploy

1. Provision Ubuntu VM (single node).
2. Install runtime:
- Python 3.12+
- reverse proxy (Caddy preferred for automatic TLS) or Nginx + certbot
- system tools (`ufw`, `fail2ban`, `logrotate`)

3. Deploy app code on VM (git clone/pull).
4. Create venv and install:
- `python3 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements-dev.txt` (or runtime-only if you prefer)

5. Configure `.env` for production values.
6. Run DB setup once:
- `remodelator db migrate`
- `remodelator db seed` (if needed)

7. Run API under process manager
- systemd service running uvicorn (or gunicorn+uvicorn worker if you prefer)
- restart policy: `always`
- non-root runtime user

8. Reverse proxy to local API port, expose only `443`/`80`.

9. Firewall
- allow: `22`, `80`, `443`
- block direct API app port from internet.

## Phase C: Stripe sandbox-to-production readiness

1. Keep Stripe in test mode first.
2. Configure webhook endpoint to your API:
- `https://api.<domain>/billing/webhook`
3. Validate signed webhook flow and checkout return path.
4. Run release gate:
- `./scripts/stripe_release_gate.sh --env-file .env --api-port 8010 --output data/stripe_release_gate/latest.json`

## Phase D: Operational hardening

1. Backups
- enable Hetzner automatic backups.
- take pre-release snapshot.
- keep app-level exports (`/backup/export`) for tenant recovery scenarios.

2. SQLite maintenance automation (cron/systemd timer)
- periodic:
  - `remodelator db integrity-check --json`
  - `remodelator db sqlite-maintenance --json`

3. Monitoring
- health check: `/health`
- alert on 5xx spikes, process restarts, disk space, backup failures.

4. Logging
- keep structured API logs (already present).
- centralize logs if possible.

## 5) Reliability/Concurrency Position (Current Code)

Current code is in a good state for this deployment class:
- WAL mode + busy timeout + foreign keys enabled.
- explicit SQLite integrity/maintenance tooling.
- operation lock for destructive admin actions.
- full quality gate passing (`backend + web + e2e + docs`).

For a non-demanding app on one VM, this is production-viable.

## 6) Minimal Ongoing Maintenance Runbook

Weekly:
- review logs and `/health`
- confirm backup success

Monthly:
- rotate admin/session secrets on schedule policy (if applicable)
- run SQLite maintenance + integrity checks
- patch OS packages and reboot during maintenance window

Before each deploy:
- `./scripts/quality_gate.sh`
- smoke test login, estimate flow, billing page, admin page

## 7) Go/No-Go Checklist

Go when all are true:
- [ ] API reachable on HTTPS custom domain
- [ ] Web reachable on Firebase domain/custom domain
- [ ] CORS restricted to actual web origins
- [ ] Stripe webhook secret configured and verified
- [ ] Payment return URL configured to live web origin
- [ ] backups enabled + restore path tested
- [ ] quality gate green on release commit
- [ ] password reset decision applied (delivery integrated OR flow disabled)

## 8) What I Still Need From You

1. Preferred domains (web + api).
2. Final hosting choice for reverse proxy (Caddy vs Nginx).
3. Whether to keep Stripe provider in simulation for first deploy window or fully enable stripe mode.
4. Whether to keep forgot-password hidden in production until delivery is implemented.

## 9) Source References

- Firebase Hosting quickstart (free Firebase subdomains + deploy flow): https://firebase.google.com/docs/hosting/quickstart
- Firebase pricing (hosting limits/pricing): https://firebase.google.com/pricing
- Firebase Hosting product docs: https://firebase.google.com/docs/hosting/
- Stripe webhooks (signature verification + HTTPS requirement in live mode): https://docs.stripe.com/webhooks
- FastAPI workers guidance: https://fastapi.tiangolo.com/deployment/server-workers/
- Uvicorn deployment guidance: https://www.uvicorn.org/deployment/
- SQLite WAL behavior/concurrency: https://sqlite.org/wal.html
- Hetzner backups/snapshots overview: https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/
