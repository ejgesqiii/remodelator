# Remodelator vNext — Frontend Handoff & Future Roadmap

**Last Updated:** March 6, 2026

This document summarizes the current frontend implementation state, how to run and validate it, and what remains for further production hardening.

---

## 1. Quickstart & Testing

You will need two terminal windows to run the fully integrated stack.

### Running the System

**Terminal 1: Start the Backend API**
```bash
# Ensure the local DB is migrated and seeded
remodelator db migrate
remodelator db seed

# Start the FastAPI server (runs on http://127.0.0.1:8000)
# Make sure to export OPENROUTER_API_KEY if testing LLM features
./scripts/run_api.sh
```

**Terminal 2: Start the Web UI**
```bash
# Start the Vite development frontend (runs on http://127.0.0.1:5173)
./scripts/run_web.sh
```

### Testing the System

**Frontend Tests:**
```bash
cd apps/web
npm run test       # Runs the unit and component tests (Vitest)
npm run test:e2e   # Runs the Golden Path end-to-end user workflows (Playwright)
```

**Backend + Full-System Quality Gate:**
```bash
./scripts/quality_gate.sh  # Runs backend tests, dead-code checks, web tests/build/e2e, docs sync, and markdown link checks
```

---

## 2. API Capability Expression & Architecture Status

**UI & API Alignment**
The UI is built with a feature-sliced SPA architecture and aligns with the backend contract represented in the typed API modules under `apps/web/src/api/`.
- **Admin Endpoints:** Represented in UI. Admin read routes are role-driven; destructive actions require explicit admin key entry in the Admin page and remain disabled until key presence + local confirmation rules are met.
- **Admin Dashboard Coverage:** Includes summary, users, activity, billing ledger, demo reset, and audit-prune preview/execute flows.
- **Billing Endpoints:** 100% represented. You can simulate Stripe attach, checkout, charge, and refund workflows directly from the Billing Page while watching the visual timeline ledger update in real-time.
- **Estimates/Line Items:** Advanced backend features like grouping, reordering, quick-starting from catalog room categories, duplicate/versioning, and recalculations all have dedicated frontend controls.
- **Estimate Add-Item UX:** The estimate detail page now includes an inline catalog picker (tree + search) inside the Add Item flow, so users can select catalog items and add them directly as line items without leaving the estimate screen.
- **LLM / OpenRouter:** Fully piped into the "LLM Assist" slide-out panel on the line-item editor.

**Cleanup & Dead Code Pruning**
During Phase 4, the completely obsolete monolithic `apps/web/src_legacy` and all outdated UX documentation (e.g., `UI_UX_INTERACTIONS.md`, taskboards) were aggressively pruned from the active directories and moved to the `/archive/` folder. The active `apps/web/src` codebase is fresh, fully typed, heavily reliant on TanStack Query, and the repository dead-code gate currently passes.

---

## 3. Admin Authentication & Setup

The system provides dual-auth mechanisms for accessing the Admin Dashboard and protected endpoints.

**Method 1: Email Whitelist (Recommended for UI)**
If a user registers or logs in with an email address that matches the backend `REMODELATOR_ADMIN_USER_EMAILS` environment variable, they are automatically granted the `admin` role in their session.
- There is no built-in default whitelist in code. You must set the list explicitly in the backend environment.
- Current deployed production whitelist contains `joe@ppl.contact`, `kkain@kainconstruction.com`, and `kkain@construction.com`.
- *To test locally:* set `REMODELATOR_ADMIN_USER_EMAILS` before starting the API, then register/login with one of those addresses and navigate to the Admin panel.

**Method 2: Admin API Key**
For programmatic access or high-risk destructive actions (like `Demo Reset`), the system requires a direct Admin API Key.
- **Local Dev Default:** In local mode, backend default is `local-admin-key` unless overridden.
- **UI Behavior:** The Admin page provides an explicit `x-admin-key` input. Destructive actions remain disabled until a key is entered.
- **Production Mode:** If `REMODELATOR_ENV=production` is set on the backend, the `local-admin-key` is strictly rejected. You must explicitly configure `REMODELATOR_ADMIN_API_KEY` and deploy that key alongside the frontend.

**Practical Admin Flow**
1. Set `REMODELATOR_ADMIN_USER_EMAILS` on the backend.
2. Register or log in with one of those email addresses.
3. Open the Admin page in the web UI; read-only admin routes work with the admin session.
4. Paste the configured `REMODELATOR_ADMIN_API_KEY` into the Admin page when you need destructive actions such as demo reset or audit prune.

---

## 4. Current State and Next Work

Current validated state:
1. Frontend route coverage includes dashboard, estimates, catalog, templates, billing, settings, and admin with role + key gating.
2. Stripe sandbox flows (probe + signed webhook lifecycle) are automated and passing.
3. Stripe PaymentIntent usage-charge flow now sends a return URL (`STRIPE_PAYMENT_RETURN_URL` with CORS/local fallback) to avoid missing-return-url payment failures.
4. Docs sync and markdown link integrity checks are part of the core quality gate.

Potential next production hardening work:

1. **Password Reset Delivery (Deferred):** 
   Password reset request/confirm endpoints and UI views are implemented. Production delivery of reset links/tokens via email/SMS provider (e.g., SendGrid/SES) is still deferred. Until integrated, keep forgot-password production exposure aligned with this limitation.
   
2. **Stripe Operational Tooling:** 
   Live Stripe adapter/webhook support is implemented and validated in sandbox. Remaining work is production operations hardening (alerts, runbooks, key rotation cadence, incident handling playbooks).

3. **Local LLM Fallback:** 
   Right now, the backend relies strictly on OpenRouter (`/pricing/llm/live`) and takes a "fail-loud" approach if OpenRouter is down. If business requirements necessitate high-availability independent of internet/OpenRouter, a deterministic local fallback (or local small model) should be implemented in the backend.

**Conclusion:** The frontend is contract-aligned with current backend behavior and covered by unit + e2e + full quality-gate checks. Remaining work is primarily production operations scope rather than core feature parity.
