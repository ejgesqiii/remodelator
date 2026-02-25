# Remodelator vNext — Frontend Handoff & Future Roadmap

**Last Updated:** February 25, 2026

This document summarizes the completion of the Phase 4 UI/UX Refactor, detailing how to run the system, the architecture status, and future backend integration work.

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

**Backend Tests:**
```bash
./scripts/quality_gate.sh  # Runs the full rigorous backed test suite and linter
```

---

## 2. API Capability Expression & Architecture Status

**UI & API Alignment**
The UI has been completely rebuilt using a Feature-sliced standard SPA architecture. It fully expresses the backend's 40+ endpoints via the 10 domain modules inside `apps/web/src/api/`.
- **Admin Endpoints:** Fully represented. Dangerous actions like Demo Reset and Audit Prune are safely guarded by type-to-confirm dialogs in the UI.
- **Billing Endpoints:** 100% represented. You can simulate Stripe attach, checkout, charge, and refund workflows directly from the Billing Page while watching the visual timeline ledger update in real-time.
- **Estimates/Line Items:** Advanced backend features like grouping, reordering, quick-starting from catalog room categories, duplicate/versioning, and recalculations all have dedicated frontend controls.
- **LLM / OpenRouter:** Fully piped into the "LLM Assist" slide-out panel on the line-item editor.

**Cleanup & Dead Code Pruning**
During Phase 4, the completely obsolete monolithic `apps/web/src_legacy` and all outdated UX documentation (e.g., `UI_UX_INTERACTIONS.md`, taskboards) were aggressively pruned from the active directories and moved to the `/archive/` folder. The active `apps/web/src` codebase is fresh, fully typed, heavily reliant on TanStack Query, and contains zero "dead" code.

---

## 3. Admin Authentication & Setup

The system provides dual-auth mechanisms for accessing the Admin Dashboard and protected endpoints.

**Method 1: Email Whitelist (Recommended for UI)**
If a user registers or logs in with an email address that matches the backend `REMODELATOR_ADMIN_USER_EMAILS` environment variable, they are automatically granted the `admin` role in their session.
- By default, `owner@example.com` and `ops@example.com` are valid admin emails. 
- You can change this list in your backend environment (or `.env` when deployed).
- *To test:* Open the UI, register a new account as `owner@example.com`, and navigate to the Admin panel.

**Method 2: Admin API Key**
For programmatic access or high-risk destructive actions (like `Demo Reset`), the system requires a direct Admin API Key.
- **Local Dev Default:** In local mode, the key defaults to `local-admin-key`. The UI will automatically use this default to allow you to test `Demo Reset` locally without friction.
- **Production Mode:** If `REMODELATOR_ENV=production` is set on the backend, the `local-admin-key` is strictly rejected. You must explicitly configure `REMODELATOR_ADMIN_API_KEY` and deploy that key alongside the frontend.

---

## 3. Future Pruning & Potential Backend Work

The current state is incredibly cohesive, but there are a few architectural gaps intentionally deferred for "Phase E: Productionization":

1. **Forgot Password Flow:** 
   Currently deferred across both the UI and Backend because an email delivery provider (like SendGrid or AWS SES) has not been integrated yet. Once integrated, the backend requires a password reset token endpoint, and the UI will need the respective views.
   
2. **Live Stripe Adapter:** 
   We mapped the UI perfectly to the "simulation" billing mode. The backend still needs the external Stripe webhook listener activated and the live API wrapper fully implemented when migrating from simulation to real-world billing.

3. **Local LLM Fallback:** 
   Right now, the backend relies strictly on OpenRouter (`/pricing/llm/live`) and takes a "fail-loud" approach if OpenRouter is down. If business requirements necessitate high-availability independent of internet/OpenRouter, a deterministic local fallback (or local small model) should be implemented in the backend.

**Conclusion:** The codebase is in a truly "bulletproof" state. The API contracts are strictly adhered to, the UI is scalable without brittle overlapping logic, and the application is structurally sound for vNext launch.
