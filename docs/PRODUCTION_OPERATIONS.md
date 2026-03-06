# Production Operations

Date deployed: March 6, 2026

## Live Topology

- Web app: `https://remodelator-781c6.web.app`
- Secondary Firebase domain: `https://remodelator-781c6.firebaseapp.com`
- API: `https://remo-api.ppl.contact`
- Server host: `prod.ppl.contact` (`65.108.75.118`)

## Server Layout

- App user: `remodelator`
- Repo checkout: `/opt/remodelator/app`
- Virtualenv: `/opt/remodelator/app/.venv`
- Runtime env file: `/etc/remodelator/remo-api.env`
- SQLite data dir: `/var/lib/remodelator`
- systemd unit: `/etc/systemd/system/remodelator-api.service`
- Nginx site: `/etc/nginx/sites-available/remo-api.ppl.contact`

## Current Runtime Posture

- API is served by `uvicorn` on `127.0.0.1:8010`
- systemd starts Uvicorn with `--app-dir /opt/remodelator/app/src`, so the live app imports directly from the checked-out source tree
- Nginx proxies `remo-api.ppl.contact` to `127.0.0.1:8010`
- TLS certificate is managed by Certbot for `remo-api.ppl.contact`
- Firebase production builds target `https://remo-api.ppl.contact` via `apps/web/.env.production`
- CORS is restricted to:
  - `https://remodelator-781c6.web.app`
  - `https://remodelator-781c6.firebaseapp.com`

## Stripe Status

- Billing provider is set to `stripe`
- Test secret key is configured on the server
- `STRIPE_PAYMENT_RETURN_URL` is set to:
  - `https://remodelator-781c6.web.app/billing?stripe_return=1`
- `STRIPE_WEBHOOK_SECRET` is intentionally not set yet

Current consequence:
- provider status reports Stripe as not ready for live test checkout/webhook flow
- final Stripe sandbox enablement still requires a real webhook signing secret from Stripe for:
  - `https://remo-api.ppl.contact/billing/webhook`

After you have the real Stripe webhook signing secret:
```bash
sudoedit /etc/remodelator/remo-api.env
sudo systemctl restart remodelator-api
curl -fsS https://remo-api.ppl.contact/health
```

## Update Workflow

Server-side pull + restart:
```bash
sudo -u remodelator -H git -C /opt/remodelator/app pull --ff-only origin main
sudo systemctl restart remodelator-api
curl -fsS https://remo-api.ppl.contact/health
```

If Python dependencies changed:
```bash
sudo -u remodelator -H bash -lc 'cd /opt/remodelator/app && .venv/bin/pip install .'
sudo systemctl restart remodelator-api
```

Firebase web deploy:
```bash
npm --prefix apps/web run build
firebase deploy --only hosting --project remodelator-781c6
```

## Monitoring And Logs

API service status:
```bash
sudo systemctl status remodelator-api
```

Follow API logs:
```bash
sudo journalctl -u remodelator-api -f
```

Last 200 API log lines:
```bash
sudo journalctl -u remodelator-api -n 200 --no-pager
```

Nginx config check + reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Nginx status:
```bash
sudo systemctl status nginx
```

TLS renewal dry run:
```bash
sudo certbot renew --dry-run
```

Public health check:
```bash
curl -fsS https://remo-api.ppl.contact/health
```

Origin health check from the server:
```bash
curl -fsS http://127.0.0.1:8010/health
```

SQLite file location:
```bash
ls -lah /var/lib/remodelator
```

## Notes

- The API service runs with one worker intentionally because this deployment is single-node + SQLite.
- A starter catalog seed was applied on first deploy.
- A temporary GitHub HTTPS credential is stored for the `remodelator` user so `git pull` works on-server.
- The server venv is intentionally local-only and ignored by Git.
- Replace that with a repo-scoped deploy credential or deploy key later if you want tighter credential isolation.
- Origin HSTS is configured correctly by the app, but Cloudflare is currently overriding the public `Strict-Transport-Security` header. If you want public HSTS enforced, set it in Cloudflare as well.
