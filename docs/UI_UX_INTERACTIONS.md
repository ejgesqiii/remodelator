# UI / UX Interaction Guide

Last updated: February 24, 2026

## Panel Model

The web app is panel-oriented:
1. Session
2. Workspace
3. Catalog + Templates
4. Billing + Output
5. Admin + Logs

Goal: every demo-critical operation is executable from UI with clear, human-readable output.
Global dependency state (OpenRouter LLM and Stripe billing readiness blockers) is surfaced in the top shell banner.

## Global Status Banners

Primary behaviors:
- action result status banner always visible in hero area,
- LLM blocker banner when OpenRouter-required path is not ready,
- billing blocker banner when billing provider is `stripe` but live readiness is false.

Expected UX outcomes:
- critical dependency blockers are visible immediately across all panels,
- reviewers do not need to navigate to Billing/Admin pages to discover launch-blocking configuration issues.

## Session Panel

Primary actions:
- Register
- Login / Logout
- Profile defaults load/update
- Activity summary refresh
- Audit trail review
- Snapshot export / restore

Expected UX outcomes:
- signed-in identity visible,
- profile update feedback visible,
- audit/activity visible without raw JSON,
- forgot-password path clearly marked as deferred until email delivery exists,
- snapshot operations recover demo data quickly.

## Workspace Panel

Primary actions:
- Create/select estimate
- Edit estimate details
- Quick-start starter items from catalog room categories (live list from current catalog tree)
- Add/edit/remove/reorder/group line items
- Recalc and lifecycle actions (`status`, `duplicate`, `version`, `unlock`)
- LLM suggest/apply workflow

Expected UX outcomes:
- selected estimate financial metrics visible (`subtotal`, `tax`, `total`),
- first-pass estimate scaffolding can be generated quickly from room category,
- line-item actions are stateful and predictable,
- LLM status is readable before suggestion actions,
- OpenRouter readiness/failure is explicit and fail-loud in UI status messaging,
- LLM suggest action is disabled when OpenRouter is not ready,
- lifecycle actions do not require CLI or raw payload inspection.

## Catalog + Templates Panel

Primary actions:
- catalog search + quick add to estimate
- catalog upsert/import
- template save/list/apply
- estimate JSON export trigger
- proposal PDF generation trigger

Expected UX outcomes:
- reusable content management is discoverable,
- export operations return clear file-result text,
- no core dependency on manual DB operations,
- proposal output remains neutral/default until branding/legal content package is confirmed.

## Billing + Output Panel

Primary actions:
- render proposal text preview
- run Stripe-like simulation flow:
  - attach card
  - checkout complete (annual subscription)
  - real-time pricing usage charge
  - webhook invoice paid / payment failed
  - cancel subscription
- simulate estimate charge/subscription/refund
- refresh billing ledger
- test idempotency replay behavior

Expected UX outcomes:
- billing events readable as event summaries,
- Stripe lifecycle events and cancel path demonstrable without live Stripe keys,
- subscription state is visible as explicit status (active/past_due/canceled) without reading raw logs,
- provider readiness is visible (simulation vs stripe) with blocker messaging when live Stripe config is incomplete,
- ledger updates visible after mutations,
- idempotency behavior demonstrable for client review.

## Admin + Logs Panel

Primary actions:
- admin summary/users/activity/billing views
- admin list filters (limit + user/action/event filters)
- audit retention preview + prune actions with retention-days input (admin key required)
- demo reset
- live action log visibility

Expected UX outcomes:
- operational state visible to reviewer,
- permission state visible (admin-role session vs admin-key requirement),
- admin responses rendered as structured cards/lists rather than debug text blocks,
- demo reset is a one-action recovery path,
- destructive admin action visually distinct.

## UX Quality Checklist

- [x] No raw JSON required for primary user journeys
- [x] Clear panel hierarchy and action grouping
- [x] Empty states present across major views
- [x] Action status banner for global success/error feedback
- [x] Mobile-responsive layout behavior
- [x] End-to-end flow covered by Playwright

## Golden Demo Script (UI)

1. Register and login.
2. Update profile defaults.
3. Create estimate.
4. Add and modify line items.
5. Use LLM suggest/apply.
6. Recalculate and change estimate status.
7. Save/apply template.
8. Render proposal and generate PDF.
9. Run billing simulation and replay test.
10. Run admin summary and demo reset.
