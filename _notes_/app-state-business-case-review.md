# App State Review: Business Case Alignment

## Scope reviewed

- Legacy baseline: `_notes_/Remodelator 2` (especially estimate/proposal flow in `Estimate2.aspx`, `Estimate2.aspx.vb`, `Proposal.aspx`, `LaborSheet.aspx`)
- Target scope: `_notes_/proposal/Remodelator_v5_Proposal_Outline.txt` and `_notes_/proposal/Remodelator_v5_Project_Estimate_Checklist.txt`
- Current implementation: React app in `apps/web/src` + API/service logic in `src/remodelator/interfaces/api` and `src/remodelator/application/service.py`

## Executive assessment

The current app **does cover the core estimating workflow** for a working MVP:

- create estimate,
- add/edit/reorder line items,
- apply item + estimate markups,
- include labor,
- recalculate totals,
- render proposal + export PDF.

However, against the original app behavior and proposal expectations, there are several important gaps in the end-to-end user flow (especially template creation UX, proposal sharing/compliance terms, and certain estimate controls), and there are also non-core surfaces that look more internal/demo-oriented than contractor-facing.

---

## User flow walkthrough (create estimate -> add items -> markups/labor -> proposal)

### 1) Create estimate

**Implemented**
- Estimate list supports create via title + optional customer name (`EstimateListPage.tsx`, `POST /estimates`).
- Status lifecycle supports `draft`, `in_progress`, `completed`, `locked`.
- Duplicate/version/unlock actions are implemented.

**Compared to legacy/proposal**
- Legacy had richer upfront client/billing profile capture (address fields, phone/fax/email, multiple billing rates, markups).
- Proposal includes CRUD including delete; current UI/API appears to have create/read/update but no user-facing estimate delete.

### 2) Add items

**Implemented**
- Manual line item add.
- Catalog picker add from category tree + search.
- Quick Start from catalog node/category (bulk starter items).
- Reorder, delete, and edit line items.

**Compared to legacy/proposal**
- Legacy experience revolved around deep room/category navigation and item selection in a tree-heavy flow.
- Current catalog appears flatter in UX (category -> items) and does not expose deeper hierarchy management in user flow.
- Proposal calls out vendor/supplier info and item imagery; current estimate add flow does not present vendor/media context.

### 3) Markups, labor, discounts, totals

**Implemented**
- Estimate-level markup and tax rate.
- Line-item markup.
- Line-item labor hours + labor rate usage in pricing engine.
- Line-item discount (flat or percent).
- Deterministic recalculation in domain pricing logic.

**Compared to legacy/proposal**
- Legacy had multiple trade-specific labor rates (remodeler/plumber/tinner/electrician/designer) and markup warnings/propagation behavior.
- Current model uses a simpler single labor rate default.
- Proposal mentions discounts broadly; current support is line-item level only (no explicit estimate-level discount control in UI).

### 4) Proposal output and handoff

**Implemented**
- Proposal render route and page.
- PDF generation endpoint + UI trigger.

**Compared to legacy/proposal**
- Legacy proposal included substantial legal/terms/disclaimer content and labor sheet access from proposal context.
- Proposal scope explicitly includes shareable proposal link and terms/by-state compliance.
- Current proposal output is simple rendered text and PDF export, with no share link/public proposal flow and no by-state terms/compliance workflow.

---

## Alignment to business case (core vs gaps)

### Strong alignment (core value delivered)

- Core estimate lifecycle (create/update/status/version/duplicate/lock).
- Practical item-entry flow (manual + catalog + quickstart).
- Markup/labor/tax arithmetic with deterministic calculation path.
- Proposal rendering/PDF generation as a basic output path.

### Material gaps (likely business-case blockers)

1. **Template creation UX gap**
- API supports template save/apply, but web UI currently surfaces list/apply only.
- Legacy flow had explicit save-as-template affordance in proposal area.

2. **Proposal sharing/compliance gap**
- No shareable link/public proposal route.
- No by-state terms/compliance management in current proposal flow.

3. **Estimate deletion/history usability**
- No obvious delete estimate action in current UI/API flow.
- Versioning exists, but no dedicated history timeline/compare UX for users.

4. **Labor/business detail depth**
- No separate labor-sheet view in current UX.
- Simplified labor-rate model vs legacy multi-role labor rates.

5. **Catalog detail depth**
- Vendor/supplier info/image context not surfaced in estimate builder flow.

---

## Potentially superfluous features (for strict MVP focus)

If the immediate goal is a lean contractor flow (estimate -> proposal), the following areas look likely to be over-scope or internal-facing at this stage:

- Advanced billing simulation controls (event-level Stripe lifecycle simulation, idempotency-key testing UI).
- Admin danger-zone tooling exposed in main app workflow (demo reset, audit prune controls).
- Backup export/restore UI for end users.
- Technical export affordances in estimate flow (JSON export) if not required by contractors.

These are useful for operations/testing, but they may distract from first-order user tasks unless intentionally positioned as admin/dev-only utilities.

---

## Comparison summary by key proposal items

### Mostly implemented

- Auth register/login and guarded app routes.
- Estimate CRUD subset (create/read/update; status changes; duplicate/version).
- Line-item operations (add/edit/remove/reorder/group).
- Markup/labor/tax calculations.
- Catalog browse/search and admin upsert/import.
- Template apply/list (save exists at API layer).
- Proposal render + PDF generation.

### Partial

- Tree navigation/category depth (implemented but simplified UX).
- Billing/subscription (substantial support exists, but user-facing polish and role targeting may need narrowing).
- Admin activity tracking (present, but partly ops/demo focused).

### Missing or not surfaced in user flow

- Estimate delete in normal user workflow.
- Template save action in web UI.
- Share proposal via link/public view.
- Terms/by-state proposal compliance flow.
- Rich proposal legal content parity with legacy format.
- Vendor/supplier media/info in item picking flow.
- Password reset flow.

---

## Recommendation

For business-case fit and minimal superfluous scope, prioritize this ordering:

1. **Close user-flow gaps first:** template save UI, proposal sharing link, terms/compliance block, estimate delete.
2. **Improve proposal fidelity:** richer output structure (customer-facing polish, legal terms handling).
3. **Decide scope boundaries explicitly:** keep billing/admin simulation tooling behind admin/dev mode or de-emphasize in contractor UX.
4. **Only then expand depth:** advanced catalog/vendor context and labor-sheet parity.

This keeps the app centered on the contractor’s primary path (estimate creation to client-ready proposal) while reducing distractions from non-core demo tooling.

