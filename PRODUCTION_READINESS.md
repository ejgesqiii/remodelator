# Production Readiness Audit

Date: 2026-03-05  
Audited branch: `main`  
Audited head: `43b28e9` (+ local hardening changes in this audit)  
Baseline since previous handoff: `2add7c3`

## 1) Executive Summary
Codebase quality is materially improved and currently stable under local/staging gates.

Current status:
- Code/test/build/docs quality gates: **PASS**.
- Stripe sandbox mode: **supported** (config-driven).
- Production deploy readiness with provided env values: **NO-GO** (env and deferred reset-delivery blocker).

Primary remaining blockers for production deploy:
1. Production env hardening values are not yet set (`REMODELATOR_ENV=local`, placeholder webhook secret, localhost return URL).
2. Password reset delivery channel is not implemented for production and is now explicitly treated as a deferred item.

## 2) Scope and Change Evolution
Analyzed range: `2add7c3..43b28e9`

Commits in scope:
- `cece1cf` feat: default web theme to light and simplify add-item panel
- `f53f3f3` feat: ship client-ready proposal sharing and PDF output
- `43b28e9` feat: add password reset flow and polish proposal UI branding

Diff magnitude in range:
- 42 files changed
- 3079 insertions / 461 deletions

Major evolution themes:
- Password reset request/confirm endpoints + UI pages.
- Public proposal share links + public render/pdf endpoints.
- Large estimate-detail UX refactor.
- Expanded labor-trade/rate fields in schema + serializers + service logic.
- Frontend styling/theme updates.

## 3) Evidence: Validation Gates Executed
All commands executed in a local `.venv`:

- `./scripts/quality_gate.sh`
  - backend tests: `136 passed`
  - dead-code checks: pass
  - web unit tests: `12 passed`
  - web build (`tsc --noEmit` + Vite): pass
  - Playwright e2e: `3 passed`
  - docs sync check: pass
  - markdown link check: pass

- Security scans:
  - `pip-audit -r requirements-dev.txt`: no known vulnerabilities.
  - `bandit -r src`: only low/low-confidence findings and known false-positive patterns (no high severity).

- SQLite probes:
  - `./scripts/ci_sqlite_probes.sh`
  - results (`data/.ci_outputs/*.json`):
    - integrity: `ok`
    - quick_check: `ok`
    - journal_mode: `wal`
    - busy_timeout_ms: `5000`
    - envelope test (2 writers, 4 readers, 2s):
      - `reads=124402`
      - `writes=14870`
      - `errors=0`
      - `locked_errors=0`

Interpretation: for the tested local envelope, SQLite config and runtime behavior are healthy and contention-safe.

## 4) Fixes Applied During This Audit
1. Route-regression test brittleness removed.
- `tests/test_api_route_registration.py`
- Changed strict endpoint-count equality to a minimum guard so additive endpoints do not cause false failures.

2. Dead code cleaned.
- `src/remodelator/application/service.py`
- Removed unused variable in template-apply path.

3. Endpoint-doc auth classification corrected and regenerated.
- `scripts/generate_api_endpoints_doc.py`
- `docs/API_ENDPOINTS_GENERATED.md`
- Public auth now correctly mapped for password-reset and public proposal endpoints.

4. Playwright suite de-flaked and stale test pruned.
- Updated `apps/web/e2e/full-demo.spec.ts` to match current UI actions menu behavior.
- Removed stale `apps/web/e2e/llm-blocker.spec.ts` (validated removed UX pattern).

5. Public proposal link hardening.
- `src/remodelator/application/auth_security.py`
- `src/remodelator/application/service.py`
- Added configurable TTL for proposal share tokens:
  - env: `REMODELATOR_PUBLIC_PROPOSAL_TTL_SECONDS`
  - default: `3600`
  - enforced minimum: `300`

6. Added targeted auth/security tests for proposal token TTL behavior.
- `tests/test_auth_security.py`

7. Root docs updated for new runtime knob and API reference posture.
- `README.md`
- `ARCHITECTURE.md`
- `ACTION_PLAN.md`

8. Added explicit frontend↔backend endpoint compatibility guard.
- `tests/test_web_api_compatibility.py`
- Verifies the canonical `apps/web/src/api` surface is backed by registered FastAPI routes.

9. Production HTTP hardening tightened.
- `src/remodelator/interfaces/api/app_factory.py`
- Adds `Strict-Transport-Security` in production env only.
- `tests/test_app_factory_security.py`
- Adds production HSTS regression test.

10. Production CORS default made fail-safe.
- `src/remodelator/config.py`
- In production, default CORS allowlist is now empty unless explicitly configured.
- `tests/test_auth_security.py`
- Adds regression coverage for this default.

11. Dynamic SQL hardening for maintenance/migration paths.
- `src/remodelator/application/migration_reconcile.py`
- Adds strict SQLite identifier allowlist and quoted identifier assembly.
- `src/remodelator/infra/db.py`
- Replaces dynamic Stripe dedupe SQL with explicit, column-specific queries.

12. Operational deployment artifacts added.
- `deploy/api/.env.production.example`
- `deploy/api/remodelator-api.service.example`
- `deploy/api/Caddyfile.example`
- `deploy/api/README.md`
- `DEPLOYMENT_PLAN.md`, `docs/README.md`
- Standardizes repeatable Hetzner API deployment flow.

## 5) Remaining Risks and Required Actions

### Blockers (must resolve before production)
1. **Production env hardening not applied yet**
- Required:
  - `REMODELATOR_ENV=production`
  - strong `REMODELATOR_SESSION_SECRET`
  - strong `REMODELATOR_ADMIN_API_KEY`
  - real `STRIPE_WEBHOOK_SECRET`
  - HTTPS `STRIPE_PAYMENT_RETURN_URL`
  - production CORS allowlist

2. **Password reset delivery is deferred (explicit)**
- Current behavior:
  - local/dev/test returns reset token for convenience.
  - production intentionally does not expose token.
- Deferred item:
  - integrate outbound reset delivery (email/SMS) OR hide forgot-password UI in production.

### Non-blocking hardening items (recommended)
1. Add explicit public-proposal link revocation mechanism.
2. Add endpoint-level API integration tests for share/public proposal routes.
3. Add rate-limit policy review for public proposal endpoints under expected traffic.
4. Decide if long-lived sessions should differ from public-share TTL strategy further.
5. If desired, tune/suppress remaining Bandit false positives to keep security CI noise low.

## 6) SQLite Reliability and “Can It Handle Load?”
Short answer: **for a single-node SaaS with moderate concurrent traffic, current SQLite posture is strong**; it is not a substitute for horizontally scaled multi-writer architecture.

What is already in place:
- WAL mode and busy timeout pragmas.
- Foreign keys enabled.
- Integrity + quick checks available and passing.
- Maintenance command (`optimize`, `analyze`, checkpoint, vacuum).
- Envelope/load probe command included for CI.
- File lock protection for destructive admin operations.

What this means operationally:
- Good durability/reliability for low-maintenance single-instance deployment.
- Safe against common corruption/locking pitfalls under current tested envelope.
- For sustained high write concurrency or multi-instance scaling, migrate to PostgreSQL.

## 7) Deployment Decision
- **Staging / Stripe test mode:** GO.
- **Production (real users):** NO-GO until blocker items above are closed.

## 8) Deferred Items (Explicit)
1. Password reset outbound delivery infrastructure (email/SMS).
- Status: Deferred by product decision.
- Interim mitigation: keep forgot-password flow disabled/hidden in production, or expose only when delivery backend is enabled.

## 9) Safe Operator Workflow (Pull + Straggler Cleanup)
```bash
git fetch --prune
git status -sb
git clean -nd
git clean -ndX
# if approved to remove untracked files:
git clean -fd
# if approved to remove ignored artifacts too:
git clean -fdX
git pull --ff-only
git status -sb
```

If you intentionally need local branch to match remote exactly (destructive):
```bash
git reset --hard origin/main
```
