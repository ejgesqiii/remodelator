# UI Refactor Plan

Last updated: February 24, 2026
Audience: product engineer rebuilding the frontend from scratch
Scope: high-level UX/product contract for a clean, client-facing React rebuild

## 1) Objective

Deliver a UI that is:
- understandable in under 2 minutes by a non-technical client,
- complete for all core workflows without terminal usage,
- reliable enough for repeated live demos,
- visually clean and digestible,
- lean in implementation (no redundant layers or debug-first surfaces).

## 2) Core Deliverables

1. New app shell with clear navigation and workflow progression.
2. End-to-end estimate workflow with guided steps and readable outcomes.
3. Human-readable billing simulation lifecycle (including cancel flow).
4. Admin operations surface that is safe, explicit, and auditable.
5. Consistent design system primitives (forms, cards, tables, alerts, modals).
6. Empty/loading/error/success states for every primary screen.
7. Zero raw JSON required for primary user journeys.
8. Responsive layout for desktop and tablet (mobile usable baseline).
9. Accessibility baseline (keyboard nav, focus states, semantic landmarks).
10. E2E-tested golden demo path for regression safety.

## 3) UX Principles (Non-Negotiable)

- Workflow first: pages should follow how users think, not how APIs are grouped.
- One action, one outcome: every mutation gives immediate, clear feedback.
- Progressive disclosure: advanced controls hidden until context is selected.
- No mystery states: dependency blockers shown globally and locally.
- Destructive safety: dangerous actions require explicit confirmation.
- Human language: plain words, no internal/debug terminology.
- Consistency over novelty: same interaction patterns everywhere.

## 4) Information Architecture

Top-level navigation:
1. Dashboard
2. Estimates
3. Catalog
4. Templates
5. Proposals
6. Billing
7. Admin
8. Settings

Suggested app shell:

```text
+--------------------------------------------------------------------------------+
| Logo | Project Name | Environment Badge | Global Alerts | User Menu            |
+----------------------+---------------------------------------------------------+
| Sidebar              | Main Content Area                                      |
| - Dashboard          | - Page header (title, context, actions)               |
| - Estimates          | - Primary workflow section                              |
| - Catalog            | - Secondary details / activity                          |
| - Templates          | - Sticky status/toast area                              |
| - Proposals          |                                                         |
| - Billing            |                                                         |
| - Admin              |                                                         |
| - Settings           |                                                         |
+----------------------+---------------------------------------------------------+
```

## 5) Page-Level Requirements

### Dashboard
- Show current session status, latest estimate activity, dependency health.
- Show explicit blockers (LLM unavailable, billing live mode unavailable).
- Show quick actions: Create Estimate, Open Last Estimate, Run Demo Reset (admin only).

### Estimates
- Primary workspace for estimate creation, editing, pricing, and lifecycle.
- Left: estimate list with search/sort/filter.
- Center: selected estimate details and line items.
- Right: totals, pricing summary, status actions, LLM assist panel.

Estimate workspace target layout:

```text
+--------------------------------------------------------------------------------+
| Estimates                                                                      |
| [New Estimate] [Duplicate] [Recalculate] [Change Status] [Lock/Unlock]       |
+-------------------------+----------------------------------+-------------------+
| Estimate List           | Estimate Workspace               | Summary Panel     |
| - Kitchen Refresh       | - Customer + project details     | - Subtotal        |
| - Bathroom Remodel      | - Line item table               | - Markups         |
| - Exterior Repair       | - Add/Edit/Group/Reorder items  | - Tax             |
|                         | - Quick-start from room category | - Total           |
|                         | - LLM pricing suggestion card    | - Warnings        |
+-------------------------+----------------------------------+-------------------+
```

### Catalog
- Browsable category tree + searchable item table.
- Add-to-estimate from catalog directly when estimate is selected.
- Admin-capable inline create/edit for prototype dataset.

### Templates
- Save selected estimate as template.
- Apply template to selected estimate with preview of impact.
- Simple list with metadata (name, item count, updated at).

### Proposals
- Rendered proposal preview in readable format.
- Export actions (PDF, JSON) with clear success/failure cards.
- Keep copy neutral/default until branding/legal content is provided.

### Billing
- Split into two sections:
- `Subscription lifecycle simulation`
- `Per-estimate pricing run charge simulation`
- Show ledger as human-readable event feed/table.
- Include idempotency replay demo action.

Billing UX target:

```text
+--------------------------------------------------------------------------------+
| Billing                                                                        |
| Plan: $1200/year  | Real-time pricing: $10/run | Provider: Simulation/Stripe  |
+---------------------------------------+----------------------------------------+
| Subscription Lifecycle                 | Usage Charges                          |
| [Attach Card] [Checkout Complete]     | [Run Pricing Charge] [Refund]          |
| [Invoice Paid] [Payment Failed]       | Amount | Estimate | Result              |
| [Cancel Subscription]                 |                                         |
+---------------------------------------+----------------------------------------+
| Ledger (latest first):                                                     |
| - 10:42 checkout_completed  +$1200  status=active                           |
| - 10:43 usage_charge        +$10    estimate=Bathroom Remodel              |
| - 10:44 subscription_canceled        status=canceled                        |
+--------------------------------------------------------------------------------+
```

### Admin
- Read-only operational summary by default.
- Filterable users/activity/billing views.
- Safe mutation controls in isolated area:
- `Audit prune`
- `Demo reset`
- Require explicit confirmation modal for destructive actions.

Admin destructive action pattern:

```text
+-------------------------------- Confirm Demo Reset ---------------------------+
| This will erase current local data and reseed baseline catalog.              |
|                                                                               |
| Type RESET to confirm: [__________]                                           |
|                                                                               |
| [Cancel]                                                [Run Demo Reset]      |
+-------------------------------------------------------------------------------+
```

### Settings
- Profile defaults (labor rate, markup, tax).
- Session controls and snapshot backup/restore.
- Future placeholder: password reset once email infrastructure exists.

## 6) Critical User Stories

1. As a user, I can create an estimate and understand totals without technical knowledge.
2. As a user, I can quickly scaffold line items by room category and edit details confidently.
3. As a user, I can request LLM pricing help and clearly see when dependency issues block it.
4. As a user, I can generate a proposal artifact and understand where it was saved.
5. As a user, I can run billing simulation events and understand account lifecycle state.
6. As an admin, I can inspect system activity and perform demo reset safely.
7. As a reviewer, I can complete a full demo flow without touching CLI tools.

## 7) Interaction Standards

- Primary action placement: top-right of page header.
- Secondary actions grouped and labeled clearly.
- Confirmation required for delete/reset/cancel-subscription flows.
- Inline form validation before submit.
- Toast + inline status card after every mutation.
- Disabled states must explain why (tooltip or helper text).

## 8) Content and Language Guidelines

- Replace technical labels with user language.
- Prefer "Estimate", "Line Item", "Proposal", "Billing Event" over internal terms.
- Avoid acronyms unless common (PDF, API).
- Use short labels and explicit verbs: "Create Estimate", "Apply Template", "Cancel Subscription".

## 9) Accessibility and Responsiveness Baseline

- WCAG AA contrast target for text and controls.
- Full keyboard path for all primary workflows.
- Visible focus outline on interactive elements.
- ARIA labels for icon-only controls.
- Breakpoints for desktop and tablet; mobile remains usable, not broken.

## 10) Technical Guardrails for Refactor

- Keep business logic in backend; UI performs orchestration and presentation only.
- Create typed API client layer and domain view-model mappers.
- Use feature folders by page/domain (not one large app controller file).
- Shared primitives only where true reuse exists.
- Avoid raw API payload rendering in feature views.
- Remove dead components/hooks during migration.

## 11) Suggested Delivery Phases

Phase 1: Shell + Design Foundation
- app shell, navigation, global alerts, typography, spacing, color system.

Phase 2: Estimates First
- complete estimate workflow (list, details, line items, totals, LLM card).

Phase 3: Catalog + Templates + Proposals
- content management and export/proposal experiences.

Phase 4: Billing + Admin
- subscription/usage simulation UX and safe admin controls.

Phase 5: Polish + Hardening
- accessibility pass, responsiveness pass, copy polish, e2e updates, visual QA.

## 12) Definition of Done for UI Refactor

1. All core workflows are executable from UI without CLI fallback.
2. No page relies on raw JSON for primary understanding.
3. Golden demo passes in e2e with readable, stable UI states.
4. Admin reset and billing flows are demonstrable and safe.
5. A new engineer can understand navigation and feature ownership quickly.

## 13) Out of Scope for This Refactor

- Final brand package (logo/legal/proposal copy).
- Live Stripe production enablement without client keys.
- Forgot-password email delivery implementation.

## 14) Handoff Notes for Rebuild Engineer

Start with user journeys, not components.
Map each page to a single owner module.
Ship vertical slices that are demo-usable, then polish.
If a control cannot be explained in one sentence, simplify it.
