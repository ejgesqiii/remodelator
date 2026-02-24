import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MainPanels } from "./MainPanels";

function noop() {}

const sessionPanelProps = {
  busy: false,
  sessionEmail: null,
  isSessionReady: false,
  registerEmail: "",
  setRegisterEmail: noop,
  registerPassword: "",
  setRegisterPassword: noop,
  registerName: "",
  setRegisterName: noop,
  loginEmail: "",
  setLoginEmail: noop,
  loginPassword: "",
  setLoginPassword: noop,
  onRegister: vi.fn(),
  onLogin: vi.fn(),
  onLogout: vi.fn(),
  profileFullName: "",
  profileRole: "user",
  setProfileFullName: noop,
  profileLaborRate: "",
  setProfileLaborRate: noop,
  profileItemMarkupPct: "",
  setProfileItemMarkupPct: noop,
  profileEstimateMarkupPct: "",
  setProfileEstimateMarkupPct: noop,
  profileTaxRatePct: "",
  setProfileTaxRatePct: noop,
  profileStatus: "",
  onLoadProfile: vi.fn(),
  onSaveProfile: vi.fn(),
  activitySummary: null,
  auditTrail: [],
  onRefreshActivity: vi.fn(),
  snapshotStatus: "",
  onExportSnapshot: vi.fn(),
  onRestoreSnapshot: vi.fn(),
};

const workspacePanelProps = {
  busy: false,
  isSessionReady: false,
  estimates: [],
  selectedEstimateId: null,
  selectedEstimate: null,
  selectedLines: [],
  selectedLineItemId: "",
  setSelectedLineItemId: noop,
  estimateTitle: "",
  setEstimateTitle: noop,
  estimateCustomerName: "",
  setEstimateCustomerName: noop,
  estimateCustomerEmail: "",
  setEstimateCustomerEmail: noop,
  estimateCustomerPhone: "",
  setEstimateCustomerPhone: noop,
  estimateJobAddress: "",
  setEstimateJobAddress: noop,
  estimateMarkupPct: "",
  setEstimateMarkupPct: noop,
  estimateTaxRatePct: "",
  setEstimateTaxRatePct: noop,
  quickstartCatalogNodeName: "Bathroom",
  setQuickstartCatalogNodeName: noop,
  quickstartMaxItems: "5",
  setQuickstartMaxItems: noop,
  quickstartCatalogNodes: ["Bathroom", "Kitchen"],
  quickstartCatalogReady: true,
  onCreateEstimate: vi.fn(),
  onSelectEstimate: noop,
  onUpdateEstimateDetails: vi.fn(),
  onApplyCatalogQuickstart: vi.fn(),
  lineItemName: "",
  setLineItemName: noop,
  lineItemQty: "",
  setLineItemQty: noop,
  lineItemUnitPrice: "",
  setLineItemUnitPrice: noop,
  lineItemLaborHours: "",
  setLineItemLaborHours: noop,
  lineItemMarkupPct: "",
  setLineItemMarkupPct: noop,
  lineItemDiscountValue: "",
  setLineItemDiscountValue: noop,
  lineItemDiscountIsPercent: false,
  setLineItemDiscountIsPercent: noop,
  lineItemGroupName: "",
  setLineItemGroupName: noop,
  onAddLineItem: vi.fn(),
  editQuantity: "",
  setEditQuantity: noop,
  editUnitPrice: "",
  setEditUnitPrice: noop,
  editLaborHours: "",
  setEditLaborHours: noop,
  editItemMarkupPct: "",
  setEditItemMarkupPct: noop,
  editDiscountValue: "",
  setEditDiscountValue: noop,
  editDiscountIsPercent: false,
  setEditDiscountIsPercent: noop,
  editGroupName: "",
  setEditGroupName: noop,
  onUpdateSelectedLine: vi.fn(),
  onRemoveSelectedLine: vi.fn(),
  onReorderSelectedLine: noop,
  lineGroupName: "",
  setLineGroupName: noop,
  onGroupLineItems: noop,
  llmStatus: "",
  llmReadyForLive: true,
  llmBlockerReason: "",
  onRefreshLlmStatus: vi.fn(),
  llmContext: "",
  setLlmContext: noop,
  llmSuggestedPrice: "",
  setLlmSuggestedPrice: noop,
  llmSuggestion: null,
  onSuggestLlm: vi.fn(),
  onApplyLlmSuggestion: vi.fn(),
  statusTarget: "draft",
  setStatusTarget: noop,
  onEstimateAction: noop,
};

const catalogPanelProps = {
  busy: false,
  isSessionReady: false,
  hasSelectedEstimate: false,
  catalogQuery: "",
  setCatalogQuery: noop,
  onCatalogSearch: vi.fn(),
  onReloadCatalogTree: vi.fn(),
  catalogUpsertName: "",
  setCatalogUpsertName: noop,
  catalogUpsertPrice: "",
  setCatalogUpsertPrice: noop,
  catalogUpsertLabor: "",
  setCatalogUpsertLabor: noop,
  catalogUpsertDescription: "",
  setCatalogUpsertDescription: noop,
  onCatalogUpsert: vi.fn(),
  catalogImportJson: "",
  setCatalogImportJson: noop,
  onCatalogImport: vi.fn(),
  catalogOpsOutput: "",
  catalogResults: [],
  onAddCatalogItem: noop,
  catalogTree: [],
  templateName: "",
  setTemplateName: noop,
  onSaveTemplate: vi.fn(),
  selectedTemplateId: "",
  setSelectedTemplateId: noop,
  templates: [],
  onApplyTemplate: vi.fn(),
  estimateExportPath: "",
  setEstimateExportPath: noop,
  onExportEstimateJson: vi.fn(),
  estimateExportResult: "",
  proposalPdfPath: "",
  setProposalPdfPath: noop,
  onGenerateProposalPdf: vi.fn(),
  proposalPdfResult: "",
};

const outputPanelProps = {
  busy: false,
  isSessionReady: false,
  hasSelectedEstimate: false,
  billingAmount: "",
  setBillingAmount: noop,
  billingDetails: "",
  setBillingDetails: noop,
  idempotencyKey: "",
  setIdempotencyKey: noop,
  stripeCustomerEmail: "",
  setStripeCustomerEmail: noop,
  stripeCardLast4: "4242",
  setStripeCardLast4: noop,
  stripeSubscriptionId: "sub_demo_001",
  setStripeSubscriptionId: noop,
  stripeCancelReason: "customer_requested",
  setStripeCancelReason: noop,
  billingPolicy: null,
  billingProviderStatus: null,
  subscriptionState: null,
  billingResponse: null,
  billingLedger: [],
  proposalPreview: "",
  onRenderProposal: vi.fn(),
  onSimulateEstimateCharge: vi.fn(),
  onSimulateSubscription: vi.fn(),
  onSimulateRefund: vi.fn(),
  onSimulateStripeCardAttach: vi.fn(),
  onSimulateStripeCheckoutComplete: vi.fn(),
  onSimulateStripeUsageCharge: vi.fn(),
  onSimulateStripeInvoicePaid: vi.fn(),
  onSimulateStripeInvoiceFailed: vi.fn(),
  onSimulateStripeCancelSubscription: vi.fn(),
  onRefreshLedger: vi.fn(),
};

const adminPanelProps = {
  busy: false,
  sessionEmail: null,
  isSessionAdmin: false,
  adminKey: "",
  setAdminKey: noop,
  adminFilters: {
    limit: "200",
    userSearch: "",
    userId: "",
    activityAction: "",
    activityEntityType: "",
    billingEventType: "",
    auditPruneRetentionDays: "365",
  },
  setAdminLimit: noop,
  setAdminUserSearch: noop,
  setAdminUserIdFilter: noop,
  setAdminActivityActionFilter: noop,
  setAdminActivityEntityTypeFilter: noop,
  setAdminBillingEventTypeFilter: noop,
  setAdminAuditPruneRetentionDays: noop,
  adminResult: { kind: "none" as const },
  logLines: [],
  demoChecklist: ["Sign in and create an estimate"],
  externalBlockers: ["Confirm pricing fixtures"],
  onAdminRequest: noop,
};

describe("MainPanels", () => {
  it("renders only the requested active panel", () => {
    render(
      <MainPanels
        activePanel="output"
        sessionPanelProps={sessionPanelProps}
        workspacePanelProps={workspacePanelProps}
        catalogPanelProps={catalogPanelProps}
        outputPanelProps={outputPanelProps}
        adminPanelProps={adminPanelProps}
      />,
    );

    expect(screen.getByRole("heading", { name: "Billing + Proposal Output" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Session" })).toBeNull();
  });

  it("disables llm suggest action when openrouter is not ready", () => {
    render(
      <MainPanels
        activePanel="workspace"
        sessionPanelProps={sessionPanelProps}
        workspacePanelProps={{ ...workspacePanelProps, llmReadyForLive: false, llmBlockerReason: "OPENROUTER_API_KEY is not set." }}
        catalogPanelProps={catalogPanelProps}
        outputPanelProps={outputPanelProps}
        adminPanelProps={adminPanelProps}
      />,
    );

    const suggestButton = screen.getByRole("button", { name: "Suggest Price" });
    expect(suggestButton).toBeDisabled();
    expect(screen.getByText(/LLM BLOCKER/i)).toBeInTheDocument();
  });

  it("disables quick-start action when catalog quick-start is not ready", () => {
    render(
      <MainPanels
        activePanel="workspace"
        sessionPanelProps={sessionPanelProps}
        workspacePanelProps={{
          ...workspacePanelProps,
          selectedEstimateId: "est-1",
          selectedEstimate: {
            id: "est-1",
            title: "Demo Estimate",
            status: "draft",
            version: 1,
            customer_name: "Demo Customer",
            customer_email: "",
            customer_phone: "",
            job_address: "",
            estimate_markup_pct: "5.00",
            tax_rate_pct: "8.25",
            subtotal: "0.00",
            tax: "0.00",
            total: "0.00",
            line_items: [],
          },
          quickstartCatalogReady: false,
        }}
        catalogPanelProps={catalogPanelProps}
        outputPanelProps={outputPanelProps}
        adminPanelProps={adminPanelProps}
      />,
    );

    fireEvent.click(screen.getByText("Quick Start from Catalog"));

    expect(screen.getByText(/Catalog quick-start is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Starter Items" })).toBeDisabled();
  });
});
