export const DEFAULT_ADMIN_KEY = "local-admin-key";
export const API_LIMIT_MIN = 1;
export const DEFAULT_ADMIN_FILTERS = {
  limit: "200",
  userSearch: "",
  userId: "",
  activityAction: "",
  activityEntityType: "",
  billingEventType: "",
  auditPruneRetentionDays: "365",
};

export const DEFAULT_PROFILE_FORM = {
  fullName: "",
  laborRate: "75.00",
  itemMarkupPct: "10.00",
  estimateMarkupPct: "5.00",
  taxRatePct: "8.25",
};

export const DEFAULT_ESTIMATE_FORM = {
  title: "Kitchen Refresh",
  customerName: "Demo Customer",
  customerEmail: "",
  customerPhone: "",
  jobAddress: "",
  estimateMarkupPct: "5.00",
  taxRatePct: "8.25",
};

export const DEFAULT_QUICKSTART_ROOM = "Bathroom";

export const DEFAULT_ESTIMATE_QUICKSTART_FORM = {
  catalogNodeName: DEFAULT_QUICKSTART_ROOM,
  maxItems: "5",
};

export const DEFAULT_LINE_ITEM_FORM = {
  name: "Countertop Install",
  qty: "1",
  unitPrice: "85.00",
  laborHours: "0",
  itemMarkupPct: "10.00",
  discountValue: "0",
  discountIsPercent: false,
  groupName: "General",
};

export const DEFAULT_EDIT_LINE_ITEM_FORM = {
  qty: "",
  unitPrice: "",
  laborHours: "",
  itemMarkupPct: "",
  discountValue: "",
  discountIsPercent: false,
  groupName: "",
};

export const DEFAULT_LLM_CONTEXT = "Mid-range residential remodel in US market";
export const DEFAULT_LLM_STATUS = "LLM status loading...";

export const DEFAULT_CATALOG_QUERY = "counter";
export const DEFAULT_CATALOG_IMPORT_JSON =
  '[{"name":"Demo Bulk Item","unit_price":"25.00","labor_hours":"1.00","description":"bulk import sample"}]';

export const DEFAULT_TEMPLATE_NAME = "Kitchen Base Template";

export const DEFAULT_BILLING_FORM = {
  amount: "1200.00",
  details: "annual subscription simulation",
};

export const DEFAULT_STRIPE_SIM_FORM = {
  customerEmail: "",
  cardLast4: "4242",
};

export const DEFAULT_STATUS_TARGET = "in_progress";

export const DEFAULT_SNAPSHOT_STATUS = "";
export const DEFAULT_PROFILE_STATUS = "";
export const DEFAULT_PROFILE_ROLE = "user";

export const DEFAULT_DEMO_CHECKLIST = [
  "Sign in and confirm profile defaults (labor, markup, tax).",
  "Create one estimate and add at least two line items.",
  "Run recalc and verify subtotal, tax, and total values.",
  "Save a template, then apply it to another estimate.",
  "Render proposal and run export actions.",
  "Run subscription + real-time pricing billing simulations.",
  "Open Admin summary/activity and verify ledger visibility.",
  "Run demo reset and confirm baseline catalog reseed.",
];

export const DEFAULT_EXTERNAL_BLOCKERS = [
  "Confirm final pricing formula order with 2-3 known-output legacy examples.",
  "Confirm hybrid billing rules: $10 trigger point, retry handling, reversals, and cancellation timing.",
  "Provide Stripe ownership and key/webhook provisioning plan for live cutover.",
  "Confirm audit retention/export policy for production.",
  "Confirm expected launch usage/concurrency envelope for final SQLite launch tuning.",
  "Provide written confirmation that legacy plaintext credentials were rotated.",
];
