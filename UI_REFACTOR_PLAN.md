# UI Refactor Plan — Remodelator

> **Replaces**: previous `UI_REFACTOR_PLAN.md`
> **Last updated**: February 25, 2026
> **Audience**: Implementation engineer building the production frontend from scratch
> **Scope**: Complete frontend teardown and rebuild — architecture, design system, pages, API integration, and delivery plan

---

## 1) Problem Statement

The current frontend (`apps/web/src/`) is a prototype-grade panel SPA that is:

| Issue | Evidence |
|---|---|
| **Monolithic controller** | Single 21KB `useAppController.ts` orchestrating all state, all actions, all panel prop assembly |
| **No routing** | Zero URL-based navigation — users cannot bookmark, share, or deep-link to any page |
| **No design system** | 548 lines of hand-written vanilla CSS with ad-hoc class names (`card`, `stack`, `list`, `badge`) |
| **No component library** | Raw `<input>`, `<button>`, `<select>` elements with no accessible primitives |
| **Prop-drilling nightmare** | `WorkspacePanel` alone takes 97 props — all threaded from the monolithic controller |
| **Panel-based IA** | Navigation maps to API shape (Session, Workspace, Catalog, Output, Admin) instead of user workflows |
| **No form management** | All 30+ form fields are individual `useState` calls with no validation |
| **No server-state management** | Manual `fetch` + `setState` with no caching, deduplication, or optimistic updates |
| **No loading/error UX** | Busy boolean toggles with no skeleton states, no error boundaries, no retry UI |
| **Zero visual polish** | Functional-only aesthetic with no personality, motion, or information hierarchy |

The backend is solid — 40+ well-structured FastAPI endpoints with clean Pydantic schemas, proper auth, billing simulation, LLM integration, and admin controls. **The backend does not need a rewrite.** The frontend needs a complete rebuild from the ground up.

---

## 2) Objective

Build a frontend that is:

1. **Immediately comprehensible** — a contractor can create an estimate in under 2 minutes
2. **Visually premium** — dark mode, modern typography, glassmorphism, micro-animations
3. **URL-routable** — every page is bookmarkable and shareable
4. **Fully typed** — end-to-end TypeScript with generated API types
5. **Server-state aware** — TanStack Query for all API calls with caching, deduplication, optimistic updates
6. **Form-validated** — React Hook Form + Zod for every user input
7. **Component-driven** — shadcn/ui primitives for accessibility, consistency, and speed
8. **Feature-sliced** — one folder per domain, no monolithic controllers
9. **Lean** — no dead code, no redundant state layers, no over-abstraction
10. **Demo-ready** — complete golden path executable without CLI

---

## 3) Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build | **Vite 6** | Already in use, fastest DX |
| Framework | **React 19 + TypeScript 5** | Already in use, keep compatibility |
| Routing | **React Router v7** | Industry standard SPA routing |
| Server state | **TanStack Query v5** | Caching, deduplication, background refresh, optimistic updates |
| Client state | **Zustand** | Minimal boilerplate for auth/UI state |
| Styling | **TailwindCSS v4** | Utility-first, rapid iteration, design tokens |
| Components | **shadcn/ui** | Accessible Radix primitives, copy-pasted (no dependency lock-in) |
| Forms | **React Hook Form + Zod** | Performant, type-safe validation |
| Icons | **Lucide React** | Clean, consistent icon set (used by shadcn) |
| Tables | **TanStack Table** | Virtual scrolling, sorting, filtering for line items and admin views |
| PDF | **@react-pdf/renderer** or server-side (existing) | Proposal PDF generation |
| Toasts | **Sonner** | Beautiful, accessible toast notifications |
| Charts | **Recharts** (optional, Phase 5) | Dashboard metrics visualization |

---

## 4) Architecture Principles

1. **Feature-sliced architecture** — group by domain (`estimates/`, `catalog/`, `billing/`), not by type (`components/`, `hooks/`, `utils/`)
2. **Typed API client** — single `api/` module with typed request/response for every endpoint
3. **Query keys as contracts** — TanStack Query keys map 1:1 to API endpoints; invalidation is explicit
4. **View-models over raw payloads** — transform API responses at the query layer, not in components
5. **Composition over props** — use context, hooks, and compound components instead of 97-prop drilling
6. **Server is the source of truth** — no client-side business logic; UI is presentation + orchestration only
7. **Progressive disclosure** — advanced controls (LLM, billing simulation, admin) hidden behind expandable sections or dedicated pages
8. **Fail-visible** — every API error surfaces as a toast + inline message; never silent

---

## 5) Information Architecture (Routes)

Navigation restructured to match **user mental model**, not API grouping:

```
/                          → Dashboard (redirect if not authenticated)
/login                     → Login page
/register                  → Registration page

/estimates                 → Estimate list (search, filter, sort)
/estimates/new             → Create new estimate (wizard)
/estimates/:id             → Estimate detail & editor
/estimates/:id/proposal    → Proposal preview + PDF export

/catalog                   → Catalog browser (tree + search)
/templates                 → Template list + management

/billing                   → Billing dashboard (subscription + usage)
/billing/ledger            → Full billing ledger

/settings                  → User profile + defaults
/settings/backup           → Snapshot export/restore

/admin                     → Admin dashboard (protected)
/admin/users               → User management
/admin/activity            → Activity trail
/admin/billing             → Billing admin view
```

### Navigation Shell

```
┌─────────────────────────────────────────────────────────────────────┐
│  Logo    Remodelator                        🔔 Alerts   👤 Menu    │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│  📊 Dashboard    │  Page Content                                    │
│  📋 Estimates    │  ┌──────────────────────────────────────────┐   │
│  📦 Catalog      │  │  Page Header (title + breadcrumb + CTA) │   │
│  📑 Templates    │  ├──────────────────────────────────────────┤   │
│  💳 Billing      │  │                                          │   │
│  ─────────       │  │  Primary content area                    │   │
│  ⚙️ Settings     │  │                                          │   │
│  🔧 Admin        │  │                                          │   │
│                   │  └──────────────────────────────────────────┘   │
│                   │  Toast area (bottom-right)                      │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## 6) Design System Foundation

### Color Palette (Dark + Light)

```
Dark Mode (default):
  --background:     hsl(224, 20%, 8%)      // Deep navy-black
  --surface:        hsl(224, 18%, 12%)     // Card surfaces
  --surface-hover:  hsl(224, 18%, 16%)     // Hover states
  --border:         hsl(224, 15%, 20%)     // Subtle borders
  --ring:           hsl(213, 94%, 55%)     // Focus rings

  --foreground:     hsl(210, 40%, 98%)     // Primary text
  --muted:          hsl(215, 16%, 57%)     // Secondary text
  --muted-fg:       hsl(215, 20%, 65%)     // Muted foreground

  --primary:        hsl(213, 94%, 55%)     // Brand blue
  --primary-fg:     hsl(0, 0%, 100%)       // White on primary

  --accent:         hsl(262, 83%, 65%)     // Purple accent
  --success:        hsl(152, 60%, 45%)     // Green
  --warning:        hsl(38, 92%, 55%)      // Amber
  --destructive:    hsl(0, 72%, 55%)       // Red

Light Mode:
  Inverted contrast versions of above with white backgrounds.
```

### Typography

```
Font stack:
  --font-heading:  'Sora', system-ui, sans-serif      // Headings
  --font-body:     'Inter', system-ui, sans-serif      // Body text
  --font-mono:     'JetBrains Mono', monospace         // Code/prices

Scale:
  text-xs:   0.75rem   (12px)  — metadata, captions
  text-sm:   0.875rem  (14px)  — secondary content
  text-base: 1rem      (16px)  — body copy
  text-lg:   1.125rem  (18px)  — subheadings
  text-xl:   1.25rem   (20px)  — section headers
  text-2xl:  1.5rem    (24px)  — page titles
  text-3xl:  1.875rem  (30px)  — hero/dashboard numbers
```

### Spacing & Layout

- **Container max-width**: 1440px centered
- **Sidebar width**: 260px (collapsible to icon-only 72px)
- **Page padding**: 24px (16px on mobile)
- **Card padding**: 20px / 24px
- **Grid gap**: 16px / 24px
- **Border radius**: 8px (sm), 12px (md), 16px (lg)

### Motion

- **Transitions**: 150ms ease for hover, 200ms for modals/panels
- **Skeleton loading**: Pulse animation on all loading states
- **Page transitions**: Subtle fade (100ms)
- **Toast entrance**: Slide up from bottom-right
- **Sidebar collapse**: Smooth width transition (200ms)

---

## 7) Project Structure

```
apps/web/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                          # Typed API client layer
│   │   ├── client.ts                 # Base fetch/axios config with auth interceptor
│   │   ├── types.ts                  # API request/response types (from backend schemas)
│   │   ├── auth.ts                   # POST /auth/register, POST /auth/login
│   │   ├── profile.ts               # GET/PUT /profile
│   │   ├── estimates.ts             # All /estimates/* endpoints
│   │   ├── catalog.ts               # GET /catalog/tree, GET /catalog/search, POST /catalog/upsert
│   │   ├── templates.ts             # POST /templates/save, GET /templates, POST /templates/apply
│   │   ├── proposals.ts             # GET /proposals/:id/render, POST /proposals/:id/pdf
│   │   ├── billing.ts              # All /billing/* endpoints
│   │   ├── llm.ts                   # All /pricing/llm/* endpoints
│   │   ├── activity.ts             # GET /audit, GET /activity, backup endpoints
│   │   └── admin.ts                # All /admin/* endpoints
│   │
│   ├── components/                   # Shared UI primitives (shadcn/ui)
│   │   ├── ui/                       # shadcn primitives (button, input, dialog, etc.)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Sidebar + header + main content layout
│   │   │   ├── Sidebar.tsx           # Collapsible sidebar navigation
│   │   │   ├── Header.tsx            # Top bar with alerts + user menu
│   │   │   ├── PageHeader.tsx        # Page title + breadcrumb + action buttons
│   │   │   └── ThemeToggle.tsx       # Dark/light mode switch
│   │   ├── feedback/
│   │   │   ├── EmptyState.tsx        # Illustrated empty state
│   │   │   ├── ErrorBoundary.tsx     # Catch-all error boundary
│   │   │   ├── LoadingSkeleton.tsx   # Generic skeleton loader
│   │   │   └── StatusBanner.tsx      # Global dependency status alerts
│   │   └── data-display/
│   │       ├── StatCard.tsx          # Metric card (number + label + trend)
│   │       ├── DataTable.tsx         # Reusable TanStack Table wrapper
│   │       ├── Timeline.tsx          # Event timeline (billing ledger, audit)
│   │       └── MoneyDisplay.tsx      # Formatted monetary value display
│   │
│   ├── features/                     # Feature-sliced domain modules
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── useAuth.ts           # Auth hook (login, register, logout, current user)
│   │   │   ├── AuthGuard.tsx        # Protected route wrapper
│   │   │   └── schemas.ts           # Zod schemas for auth forms
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx     # Overview with stats, recent estimates, quick actions
│   │   │   └── QuickActions.tsx      # Create estimate, open last, etc.
│   │   │
│   │   ├── estimates/
│   │   │   ├── EstimateListPage.tsx  # List with search, filter, sort
│   │   │   ├── EstimateDetailPage.tsx # Full estimate editor with tabs
│   │   │   ├── CreateEstimateDialog.tsx
│   │   │   ├── EstimateHeader.tsx    # Status badge, actions dropdown, financial summary
│   │   │   ├── CustomerInfo.tsx      # Customer/job details form section
│   │   │   ├── LineItemTable.tsx     # Full line-item table with inline edit
│   │   │   ├── AddLineItemForm.tsx   # Add new line item (from catalog or manual)
│   │   │   ├── LineItemEditor.tsx    # Edit selected line item (slide-out or inline)
│   │   │   ├── QuickstartDialog.tsx  # Quick-start from catalog room
│   │   │   ├── LlmAssistPanel.tsx   # LLM pricing suggestion sidebar panel
│   │   │   ├── EstimateSummary.tsx   # Subtotal / markup / tax / total breakdown
│   │   │   ├── useEstimates.ts      # TanStack Query hooks for estimates
│   │   │   ├── useLineItems.ts      # TanStack Query hooks for line items
│   │   │   └── schemas.ts           # Zod schemas for estimate forms
│   │   │
│   │   ├── catalog/
│   │   │   ├── CatalogPage.tsx       # Tree browser + search + item detail
│   │   │   ├── CatalogTree.tsx       # Expandable tree component
│   │   │   ├── CatalogSearch.tsx     # Search bar + results
│   │   │   ├── ItemCard.tsx          # Item detail card
│   │   │   ├── UpsertItemDialog.tsx  # Create/edit catalog item
│   │   │   ├── ImportDialog.tsx      # Bulk import
│   │   │   ├── useCatalog.ts        # TanStack Query hooks
│   │   │   └── schemas.ts
│   │   │
│   │   ├── templates/
│   │   │   ├── TemplateListPage.tsx  # Template list with apply/delete
│   │   │   ├── SaveTemplateDialog.tsx
│   │   │   ├── ApplyTemplateDialog.tsx
│   │   │   ├── useTemplates.ts
│   │   │   └── schemas.ts
│   │   │
│   │   ├── proposals/
│   │   │   ├── ProposalPage.tsx      # Rendered proposal preview
│   │   │   ├── ProposalPreview.tsx   # Formatted proposal content
│   │   │   ├── ExportActions.tsx     # PDF + JSON export buttons
│   │   │   └── useProposals.ts
│   │   │
│   │   ├── billing/
│   │   │   ├── BillingPage.tsx       # Subscription + usage overview
│   │   │   ├── SubscriptionCard.tsx  # Subscription lifecycle state
│   │   │   ├── UsageCard.tsx         # Per-estimate usage charges
│   │   │   ├── SimulationPanel.tsx   # Stripe-like simulation controls
│   │   │   ├── LedgerPage.tsx        # Full billing ledger table
│   │   │   ├── LedgerTimeline.tsx    # Human-readable event timeline
│   │   │   ├── useBilling.ts
│   │   │   └── schemas.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx      # Profile + defaults form
│   │   │   ├── ProfileForm.tsx       # Name, email, rate, markup, tax
│   │   │   ├── BackupSection.tsx     # Export/restore snapshot
│   │   │   └── useSettings.ts
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardPage.tsx  # Aggregate stats
│   │       ├── AdminUsersPage.tsx      # User list with search
│   │       ├── AdminActivityPage.tsx   # Activity trail with filters
│   │       ├── AdminBillingPage.tsx    # Cross-user billing view
│   │       ├── DemoResetDialog.tsx     # Destructive action with confirmation
│   │       ├── AuditPruneDialog.tsx    # Audit prune with dry-run preview
│   │       ├── useAdmin.ts
│   │       └── schemas.ts
│   │
│   ├── stores/                       # Zustand stores (client-only state)
│   │   ├── authStore.ts             # Session token, user identity
│   │   └── uiStore.ts              # Sidebar collapsed, theme, active modals
│   │
│   ├── hooks/                        # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/                          # Utility library
│   │   ├── cn.ts                    # clsx + twMerge utility
│   │   ├── formatters.ts           # Money, date, percentage formatters
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   └── constants.ts            # API base URL, route paths
│   │
│   ├── App.tsx                       # Router + providers + layout
│   ├── main.tsx                      # Entry point
│   ├── index.css                    # Tailwind imports + CSS custom properties
│   └── vite-env.d.ts
│
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── components.json                   # shadcn/ui config
└── package.json
```

---

## 8) API Client Layer

Single source of truth for all backend communication. Every endpoint gets a typed function.

### Client setup (`api/client.ts`)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'x-session-token': token } : {}),
    ...options?.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, error);
  }
  return res.json();
}
```

### Endpoint mapping (complete)

| API Module | Endpoint | Client Function |
|---|---|---|
| **auth** | `POST /auth/register` | `register(data)` |
| **auth** | `POST /auth/login` | `login(data)` |
| **profile** | `GET /profile` | `getProfile()` |
| **profile** | `PUT /profile` | `updateProfile(data)` |
| **estimates** | `POST /estimates` | `createEstimate(data)` |
| **estimates** | `GET /estimates` | `listEstimates()` |
| **estimates** | `GET /estimates/:id` | `getEstimate(id)` |
| **estimates** | `PUT /estimates/:id` | `updateEstimate(id, data)` |
| **estimates** | `POST /estimates/:id/status` | `setEstimateStatus(id, status)` |
| **estimates** | `POST /estimates/:id/unlock` | `unlockEstimate(id)` |
| **estimates** | `POST /estimates/:id/duplicate` | `duplicateEstimate(id)` |
| **estimates** | `POST /estimates/:id/version` | `versionEstimate(id)` |
| **estimates** | `POST /estimates/:id/recalc` | `recalcEstimate(id)` |
| **estimates** | `POST /estimates/:id/quickstart` | `quickstartEstimate(id, data)` |
| **estimates** | `POST /estimates/:id/export` | `exportEstimate(id)` |
| **line items** | `POST /estimates/:id/line-items` | `addLineItem(estimateId, data)` |
| **line items** | `PUT /estimates/:id/line-items/:lid` | `updateLineItem(estimateId, lid, data)` |
| **line items** | `DELETE /estimates/:id/line-items/:lid` | `deleteLineItem(estimateId, lid)` |
| **line items** | `POST /estimates/:id/line-items/:lid/reorder` | `reorderLineItem(estimateId, lid, data)` |
| **line items** | `POST /estimates/:id/line-items/group` | `groupLineItems(estimateId, data)` |
| **catalog** | `GET /catalog/tree` | `getCatalogTree()` |
| **catalog** | `GET /catalog/search` | `searchCatalog(query)` |
| **catalog** | `POST /catalog/upsert` | `upsertCatalogItem(data)` |
| **catalog** | `POST /catalog/import` | `importCatalog(data)` |
| **templates** | `POST /templates/save` | `saveTemplate(data)` |
| **templates** | `GET /templates` | `listTemplates()` |
| **templates** | `POST /templates/apply` | `applyTemplate(data)` |
| **proposals** | `GET /proposals/:id/render` | `renderProposal(id)` |
| **proposals** | `POST /proposals/:id/pdf` | `generateProposalPdf(id)` |
| **billing** | `GET /billing/policy` | `getBillingPolicy()` |
| **billing** | `GET /billing/provider-status` | `getBillingProviderStatus()` |
| **billing** | `GET /billing/subscription-state` | `getSubscriptionState()` |
| **billing** | `POST /billing/simulate-subscription` | `simulateSubscription(data)` |
| **billing** | `POST /billing/simulate-estimate-charge` | `simulateEstimateCharge(data)` |
| **billing** | `POST /billing/simulate-event` | `simulateEvent(data)` |
| **billing** | `POST /billing/simulate-refund` | `simulateRefund(data)` |
| **billing** | `GET /billing/ledger` | `getBillingLedger()` |
| **llm** | `GET /pricing/llm/status` | `getLlmStatus()` |
| **llm** | `POST /pricing/llm/live` | `getLlmSuggestion(data)` |
| **llm** | `POST /pricing/llm/apply` | `applyLlmSuggestion(data)` |
| **activity** | `GET /audit` | `getAuditTrail()` |
| **activity** | `GET /activity` | `getActivitySummary()` |
| **backup** | `GET /backup/export` | `exportBackup()` |
| **backup** | `POST /backup/restore` | `restoreBackup(data)` |
| **admin** | `GET /admin/summary` | `getAdminSummary()` |
| **admin** | `GET /admin/users` | `getAdminUsers(params)` |
| **admin** | `GET /admin/activity` | `getAdminActivity(params)` |
| **admin** | `GET /admin/billing-ledger` | `getAdminBillingLedger(params)` |
| **admin** | `POST /admin/audit-prune` | `pruneAudit(params)` |
| **admin** | `POST /admin/demo-reset` | `demoReset()` |
| **system** | `GET /health` | `healthCheck()` |

---

## 9) Page-by-Page Specification

### 9.1 — Login / Register

**Route**: `/login`, `/register`
**API**: `POST /auth/login`, `POST /auth/register`

- Clean centered card layout with gradient background
- Form fields: email, password (+ full_name on register)
- Zod validation with inline error messages
- Loading spinner on submit
- Error toast on failure (wrong credentials, email taken)
- Redirect to `/` on success
- "Switch to Register/Login" link

### 9.2 — Dashboard

**Route**: `/`
**API**: `GET /profile`, `GET /activity`, `GET /pricing/llm/status`, `GET /billing/provider-status`

- **Stat cards row**: Total estimates, Active estimates, Billing total, Catalog items
- **Quick actions**: "New Estimate" (primary CTA), "Open Last Estimate", "Browse Catalog"
- **Recent estimates**: Latest 5 estimates as compact cards (click to navigate)
- **System health**: LLM status indicator, Billing provider status, DB health
- **Dependency blockers**: Prominent banner if LLM unavailable or billing in degraded state

### 9.3 — Estimates List

**Route**: `/estimates`
**API**: `GET /estimates`

- **Toolbar**: Search input, status filter dropdown, sort toggle, "New Estimate" button
- **Estimate cards grid** (responsive 1-3 columns):
  - Title, customer name, status badge, total amount, line item count
  - Updated timestamp
  - Click → navigates to `/estimates/:id`
- **Empty state**: Illustrated "No estimates yet" with CTA to create first
- **Loading state**: Skeleton cards

### 9.4 — Estimate Detail / Editor

**Route**: `/estimates/:id`
**API**: Full estimates + line items + LLM endpoints

This is the primary workspace — the most complex and important page.

**Layout**: Three-zone responsive layout

```
┌──────────────────────────────────────────────────────────────┐
│  📋 Smith Bathroom Remodel  [Draft ▾]  [⋮ Actions]          │
│  Customer: Jane Smith • 555-1234 • 123 Main St              │
├──────────────────────────────────┬───────────────────────────┤
│                                  │                           │
│  Line Items                      │  Summary                  │
│  ┌────────────────────────────┐  │  ┌─────────────────────┐ │
│  │ Item          Qty  Price   │  │  │ Subtotal   $4,200   │ │
│  │ ─────────────────────────  │  │  │ Markup      $420    │ │
│  │ Toilet        1    $340    │  │  │ Tax         $404    │ │
│  │ Vanity        1    $580    │  │  │ ─────────────────── │ │
│  │ Tile (floor)  45sf $28/sf  │  │  │ Total      $5,024   │ │
│  │ ...                        │  │  └─────────────────────┘ │
│  └────────────────────────────┘  │                           │
│                                  │  Quick Start              │
│  [+ Add Line Item]               │  [🏠 Room] [Max items]   │
│                                  │  [Add Starter Items]      │
│                                  │                           │
│                                  │  🤖 LLM Assist            │
│                                  │  Status: ● Ready          │
│                                  │  [Get Price Suggestion]   │
│                                  │                           │
│                                  │  Actions                  │
│                                  │  [Recalculate]            │
│                                  │  [Duplicate]              │
│                                  │  [Create Version]         │
│                                  │  [View Proposal →]        │
│                                  │  [Export JSON]            │
└──────────────────────────────────┴───────────────────────────┘
```

**Key interactions**:
- **Inline edit**: Click any line item cell to edit in place, or click row to open editor panel
- **Add line item**: Slide-out form or modal with item name, qty, unit price, labor, markup, discount, group
- **Quick-start**: Dialog with room category dropdown (populated from catalog tree) + max items
- **LLM assist**: Select a line item → click "Get Suggestion" → see suggestion card with confidence/rationale → "Apply" or dismiss
- **Status actions**: Dropdown with status transitions + lifecycle actions (duplicate, version, unlock)
- **Estimate detail edit**: Expandable section for customer name, email, phone, job address, markup %, tax %

### 9.5 — Proposal Preview

**Route**: `/estimates/:id/proposal`
**API**: `GET /proposals/:id/render`, `POST /proposals/:id/pdf`

- Rendered proposal in clean document layout
- Print-friendly styling
- **Export toolbar**: "Download PDF", "Export JSON"
- Back link to estimate detail

### 9.6 — Catalog Browser

**Route**: `/catalog`
**API**: `GET /catalog/tree`, `GET /catalog/search`, `POST /catalog/upsert`

**Layout**: Tree + detail split

```
┌────────────────────┬─────────────────────────────────────────┐
│  Categories        │  Items                                   │
│                    │  [Search: ____________] [+ Add Item]     │
│  ▸ Bathroom        │                                          │
│    ▸ Fixtures      │  ┌──────┬──────┬───────┬──────────────┐ │
│    ▸ Tile          │  │ Name │ Price│ Labor │ Actions      │ │
│    ▸ Plumbing      │  ├──────┼──────┼───────┼──────────────┤ │
│  ▸ Kitchen         │  │ ...  │ ...  │ ...   │ Edit | Add→  │ │
│  ▸ Basement        │  └──────┴──────┴───────┴──────────────┘ │
│  ▸ Exterior        │                                          │
└────────────────────┴─────────────────────────────────────────┘
```

- **Tree navigation**: Expandable/collapsible nodes
- **Search**: Real-time search across catalog
- **Quick-add**: "Add to Estimate" button on each item (requires active estimate context)
- **Admin operations**: Upsert item dialog, bulk import dialog

### 9.7 — Templates

**Route**: `/templates`
**API**: `GET /templates`, `POST /templates/save`, `POST /templates/apply`

- **Template list**: Name, line item count, created date
- **Save template**: "Save Current Estimate as Template" button (available from estimate detail)
- **Apply template**: "Apply to Estimate" with estimate selector dropdown + confirmation
- **Empty state** if no templates saved

### 9.8 — Billing Dashboard

**Route**: `/billing`
**API**: All `/billing/*` endpoints

**Layout**: Two-card horizontal split

```
┌────────────────────────────────┬──────────────────────────────┐
│  Subscription                  │  Usage Charges                │
│                                │                               │
│  Plan: $1,200/year             │  Rate: $10/pricing run        │
│  Status: ● Active              │                               │
│  Provider: Simulation          │  [Run Pricing Charge]         │
│                                │  [Simulate Refund]            │
│  Lifecycle Actions:            │                               │
│  [Attach Card]                 │  Recent charges:              │
│  [Complete Checkout]           │  • $10 — Bathroom Remodel     │
│  [Invoice Paid]                │  • $10 — Kitchen Refresh      │
│  [Payment Failed]              │                               │
│  [Cancel Subscription]         │                               │
├────────────────────────────────┴──────────────────────────────┤
│  Billing Ledger (latest first)                        [View All]│
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 10:42  checkout_completed   +$1,200  status=active      │ │
│  │ 10:43  usage_charge         +$10     est=Bathroom       │ │
│  │ 10:44  subscription_canceled         status=canceled     │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- **Subscription state card**: Live status (active/past_due/canceled) with visual indicator
- **Simulation controls**: Buttons for each Stripe-like lifecycle event
- **Idempotency key input**: Optional field for replay testing
- **Ledger timeline**: Human-readable event feed with amounts and status changes
- **Provider status**: Prominent indicator (simulation vs. stripe) with blocker reason if applicable

### 9.9 — Settings

**Route**: `/settings`
**API**: `GET /profile`, `PUT /profile`, backup endpoints

- **Profile form**: Full name, labor rate, default item markup %, default estimate markup %, tax rate %
- **Backup section**: "Export Snapshot" and "Restore from Snapshot" with file upload
- **Activity summary**: Quick stats (estimates, line items, billing events)
- **Audit trail**: Recent audit events in timeline format

### 9.10 — Admin Dashboard

**Route**: `/admin`, `/admin/users`, `/admin/activity`, `/admin/billing`
**API**: All `/admin/*` endpoints

- **Admin dashboard** (`/admin`):
  - Summary stat cards (users, estimates, line items, billing events, billing total, catalog nodes/items)
  - Quick navigation to sub-pages
  - **Demo Reset** button (with type-to-confirm dialog)
  - **Audit Prune** button (with dry-run preview + retention days input)

- **Users** (`/admin/users`):
  - DataTable with search, showing email, role, full name, estimates count, last login

- **Activity** (`/admin/activity`):
  - DataTable with filters for user_id, action, entity_type

- **Billing** (`/admin/billing`):
  - DataTable with filters for user_id, event_type

All admin pages require admin auth (admin-role session or admin key).

---

## 10) UX Patterns & Standards

### Global feedback
- **Toast notifications** (Sonner): Success/error/info after every mutation
- **Status banner**: Persistent banner in header for dependency blockers (LLM down, billing provider not ready)
- **Loading states**: Skeleton loaders on every page, never a blank screen

### Form patterns
- **Inline validation**: Errors appear below fields on blur
- **Submit button**: Shows loading spinner, disabled during submission
- **Dirty tracking**: Unsaved changes prompt before navigation

### Destructive actions
- **Standard confirmation**: Dialog with action description + Cancel/Confirm
- **High-risk confirmation**: Type-to-confirm (e.g., "RESET" for demo reset, "PRUNE" for audit prune)
- **Visual distinction**: Red/destructive styling for dangerous buttons

### Empty states
Every list/table has a designed empty state with:
- Relevant illustration or icon
- Short explanation
- Call-to-action button

### Accessibility
- WCAG AA contrast ratios
- Full keyboard navigation path for all primary workflows
- Focus ring on all interactive elements
- ARIA labels on icon-only buttons
- Semantic HTML landmarks (`<nav>`, `<main>`, `<aside>`)
- Skip-to-content link

### Responsiveness
- Desktop (1200px+): Full sidebar + content
- Tablet (768px-1199px): Collapsible sidebar, stacked layouts
- Mobile (< 768px): Bottom navigation or hamburger menu, single-column layouts

---

## 11) Delivery Phases

### Phase 1: Foundation (est. 2-3 days)

**Goal**: Fresh project scaffolded with all infrastructure in place.

- [ ] Rename `apps/web/src` → `apps/web/src_legacy`
- [ ] Initialize fresh Vite + React 19 + TypeScript project in `apps/web/src`
- [ ] Install and configure: TailwindCSS v4, shadcn/ui, React Router v7, TanStack Query v5, Zustand, React Hook Form, Zod, Lucide icons, Sonner
- [ ] Set up design system: CSS custom properties, fonts (Sora, Inter, JetBrains Mono), color palette
- [ ] Build `AppShell` layout: responsive sidebar + header + main content area
- [ ] Build route structure with all paths defined (empty page placeholders)
- [ ] Build `api/client.ts` with auth interceptor
- [ ] Build auth store (Zustand) + `AuthGuard` component
- [ ] Build Login + Register pages (functional against backend)
- [ ] Set up TanStack Query client with defaults (staleTime, retry, error handling)
- [ ] Build global error boundary + toast integration
- [ ] Verify: Login/register works end-to-end against running backend

### Phase 2: Estimates Core (est. 3-4 days)

**Goal**: Complete estimate creation and editing workflow.

- [ ] Build `api/estimates.ts` and `api/profile.ts` — all typed API functions
- [ ] Build `useEstimates` and `useLineItems` TanStack Query hooks
- [ ] Build Estimate List page with cards, search, status filter
- [ ] Build Create Estimate dialog with Zod validation
- [ ] Build Estimate Detail page layout (three-zone)
- [ ] Build Line Item table with TanStack Table (sort, inline select)
- [ ] Build Add Line Item form
- [ ] Build Line Item inline editor (edit, delete, reorder)
- [ ] Build Estimate Summary sidebar (subtotal, markup, tax, total)
- [ ] Build Customer Info editor section
- [ ] Build Quick Start dialog (room category from catalog tree)
- [ ] Build Estimate lifecycle actions (status, duplicate, version, unlock, recalc)
- [ ] Verify: Full estimate creation + edit + recalc flow works

### Phase 3: Catalog + Templates + Proposals (est. 2-3 days)

**Goal**: Content management and output generation.

- [ ] Build `api/catalog.ts`, `api/templates.ts`, `api/proposals.ts`
- [ ] Build Catalog browser page with tree navigation + search
- [ ] Build catalog item cards with "Add to estimate" action
- [ ] Build Upsert Item dialog and Import dialog
- [ ] Build Template List page
- [ ] Build Save Template + Apply Template dialogs
- [ ] Build Proposal Preview page
- [ ] Build PDF export action
- [ ] Build LLM Assist panel (status indicator, suggest action, suggestion card, apply action)
- [ ] Verify: Catalog browse → add to estimate → save template → apply template → render proposal → export PDF

### Phase 4: Billing + Admin (est. 2-3 days)

**Goal**: Billing simulation and admin operations.

- [ ] Build `api/billing.ts` and `api/admin.ts`
- [ ] Build Billing Dashboard with subscription + usage cards
- [ ] Build simulation lifecycle buttons
- [ ] Build billing ledger timeline
- [ ] Build idempotency key testing UI
- [ ] Build Admin Dashboard with stat cards
- [ ] Build Admin Users/Activity/Billing data tables with filters
- [ ] Build Demo Reset dialog (type-to-confirm)
- [ ] Build Audit Prune dialog (with dry-run preview)
- [ ] Verify: Full billing simulation lifecycle + admin reset works

### Phase 5: Settings + Dashboard + Polish (est. 2-3 days)

**Goal**: Complete all pages and visual polish.

- [ ] Build Settings page (profile form, backup section, activity/audit)
- [ ] Build Dashboard page (stats, recent estimates, quick actions, system health)
- [ ] Polish all pages: micro-animations, hover effects, transitions
- [ ] Dark/light mode toggle
- [ ] Responsive breakpoint testing
- [ ] Loading skeleton implementation for all pages
- [ ] Empty state design for all lists
- [ ] Error state handling across all pages

### Phase 6: Testing + Hardening (est. 1-2 days)

**Goal**: Production-ready quality.

- [ ] Accessibility audit (keyboard nav, focus management, contrast)
- [ ] Update Playwright E2E tests for new UI
- [ ] Update Vitest unit tests for new hooks/utilities
- [ ] Build golden-path E2E test (register → estimate → proposal → billing → admin reset)
- [ ] Performance audit (bundle size, lazy loading, code splitting)
- [ ] Clean up `src_legacy/` removal
- [ ] Update all documentation references

**Total estimated time: 12-18 days**

---

## 12) Migration Strategy

1. **Rename, don't delete**: `apps/web/src` → `apps/web/src_legacy` — legacy code stays accessible for reference
2. **Fresh `src/`**: New directory with clean structure from Phase 1
3. **Same entry points**: `index.html` and `main.tsx` remain the Vite entry — just new content
4. **Backend unchanged**: Zero backend modifications required — same API, same types
5. **Port API logic**: Existing `*Actions.ts` files contain working API call patterns — port to typed `api/` module
6. **Port formatters**: Existing `formatters.ts` is clean — port directly
7. **Port types**: Existing `types.ts` is well-defined — evolve into `api/types.ts`
8. **Kill the controller**: `useAppController.ts` is the root of all evil — do not port, decompose into feature hooks
9. **Legacy cleanup**: After Phase 6 verification, delete `src_legacy/`

---

## 13) Backend Assessment

The backend is **production-ready for this frontend rebuild**. Specifically:

| Area | Status | Notes |
|---|---|---|
| API design | ✅ Clean | RESTful, consistent, well-documented |
| Auth model | ✅ Solid | HMAC session tokens, PBKDF2 passwords |
| Request schemas | ✅ Strict | Pydantic v2 with `extra=forbid` |
| Error responses | ✅ Structured | Consistent error envelope with request_id |
| Billing simulation | ✅ Complete | Full Stripe-like lifecycle with idempotency |
| LLM integration | ✅ Operational | OpenRouter with fail-loud behavior |
| Admin endpoints | ✅ Feature-complete | Summary, users, activity, billing, prune, reset |
| Rate limiting | ✅ Configurable | Sliding window per-route |
| CORS | ✅ Config-driven | Origin allowlist |

**No backend changes needed** for Phase 1-6 of this plan.

---

## 14) Verification Plan

### Automated Tests

**Unit tests** (Vitest):
```bash
cd apps/web && npm run test
```
- API client functions (mock fetch)
- Formatters and utility functions
- Zustand store behaviors
- Zod schema validations

**E2E tests** (Playwright):
```bash
cd apps/web && npm run test:e2e
```
Golden-path test covering:
1. Register new user
2. Login
3. Update profile defaults
4. Create estimate
5. Add line items
6. Quick-start from catalog room
7. Edit and reorder line items
8. Recalculate estimate
9. Change estimate status
10. Save template, apply template
11. Render proposal, export PDF
12. Run billing simulation lifecycle
13. View billing ledger
14. Run admin summary
15. Run demo reset

### Manual Verification

1. **Visual QA**: Open app in Chrome, Firefox, Safari — verify consistent rendering
2. **Responsive check**: Resize browser through breakpoints (desktop → tablet → mobile)
3. **Keyboard navigation**: Tab through entire estimate creation flow without mouse
4. **Dark/light mode**: Toggle theme and verify all pages render correctly
5. **Error handling**: Disconnect backend, verify error states appear cleanly
6. **Demo flow**: Execute full golden demo script from `ARCHITECTURE.md` §13

---

## 15) Definition of Done

1. ✅ All routes render with designed layouts and working API integration
2. ✅ Full estimate workflow executable (create → edit → price → propose → export)
3. ✅ Billing simulation lifecycle demonstrable without CLI
4. ✅ Admin operations safe and auditable
5. ✅ No raw JSON visible in any primary user journey
6. ✅ Loading, empty, and error states on every page
7. ✅ Dark mode + light mode functional
8. ✅ Responsive across desktop/tablet/mobile breakpoints
9. ✅ Keyboard navigable for all primary workflows
10. ✅ E2E golden-path test passes
11. ✅ Zero `src_legacy/` imports in production code
12. ✅ Bundle size under 500KB gzipped (excluding fonts)

---

## 16) Out of Scope

- Backend API modifications (backend is ready as-is)
- Brand/logo package (use neutral defaults)
- Live Stripe production enablement (simulation-only)
- Forgot-password email delivery (deferred per ARCHITECTURE.md)
- Mobile native app
- Real-time WebSocket updates (future enhancement)
- i18n/l10n (English only for prototype)
