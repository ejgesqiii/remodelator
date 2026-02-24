# Remodelator Web (React)

React + TypeScript client for Remodelator vNext.

## Commands

Install:
```bash
npm ci
```

Run dev server:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Test:
```bash
npm run test
```

E2E smoke test:
```bash
npm run test:e2e
```

Preferred from repository root:
```bash
./scripts/run_web.sh
```

## API Connection

Default client base:
- `/api`

Vite dev proxy maps `/api/*` to:
- `http://127.0.0.1:8000/*`

Optional override:
- `VITE_API_BASE`

## Current UI Coverage

- Session register/login/logout
- Estimate create/select/update actions
- Line item add
- Line item edit/remove/reorder/group
- Catalog search and add-to-estimate
- Catalog upsert/import (JSON)
- Template save/apply/list
- Proposal render
- Proposal PDF output trigger
- Estimate JSON export trigger
- LLM suggest/apply (OpenRouter live required; fail-loud on provider failure)
- Billing simulation (estimate charge/subscription/refund) with idempotency key
- Stripe-like gateway simulation (card attach, checkout complete, usage charge, invoice webhooks, cancel subscription flow)
- Billing ledger view
- Admin summary/users/activity/billing
- Admin demo reset
