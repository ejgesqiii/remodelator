import { DEFAULT_BILLING_FORM, DEFAULT_SNAPSHOT_STATUS, DEFAULT_STRIPE_SIM_FORM } from "./defaults";
import {
  ActivitySummary,
  AuditEntry,
  BillingEvent,
  BillingMutationResult,
  BillingPolicy,
  BillingSubscriptionState,
  Estimate,
  LlmSuggestion,
  TemplateSummary,
} from "../types";

type ClearWorkspaceOptions = {
  setEstimates: (value: Estimate[]) => void;
  setSelectedEstimateId: (value: string | null) => void;
  setSelectedEstimate: (value: Estimate | null) => void;
  setSelectedLineItemId: (value: string) => void;
  resetEstimateForm: () => void;
  resetLineItemForm: () => void;
  resetEditLineItemForm: () => void;
  setProposalPreview: (value: string) => void;
  setBillingResponse: (value: BillingMutationResult | null) => void;
  setBillingAmount?: (value: string) => void;
  setBillingDetails?: (value: string) => void;
  setIdempotencyKey?: (value: string) => void;
  setStripeCustomerEmail?: (value: string) => void;
  setStripeCardLast4?: (value: string) => void;
  setStripeSubscriptionId?: (value: string) => void;
  setStripeCancelReason?: (value: string) => void;
  setBillingPolicy?: (value: BillingPolicy | null) => void;
  setBillingProviderStatus?: (value: null) => void;
  setSubscriptionState?: (value: BillingSubscriptionState | null) => void;
  setBillingLedger: (value: BillingEvent[]) => void;
  setTemplates: (value: TemplateSummary[]) => void;
  setSelectedTemplateId: (value: string) => void;
  setProposalPdfResult: (value: string) => void;
  setEstimateExportResult: (value: string) => void;
  setLlmSuggestion: (value: LlmSuggestion | null) => void;
  setLlmSuggestedPrice: (value: string) => void;
  setCatalogOpsOutput: (value: string) => void;
  setActivitySummary: (value: ActivitySummary | null) => void;
  setAuditTrail: (value: AuditEntry[]) => void;
  setLastSnapshot: (value: null) => void;
  setSnapshotStatus: (value: string) => void;
  setAdminResultNone: () => void;
};

export function clearWorkspaceState(options: ClearWorkspaceOptions) {
  options.setEstimates([]);
  options.setSelectedEstimateId(null);
  options.setSelectedEstimate(null);
  options.setSelectedLineItemId("");
  options.resetEstimateForm();
  options.resetLineItemForm();
  options.resetEditLineItemForm();
  options.setProposalPreview("");
  options.setBillingResponse(null);
  options.setBillingAmount?.(DEFAULT_BILLING_FORM.amount);
  options.setBillingDetails?.(DEFAULT_BILLING_FORM.details);
  options.setIdempotencyKey?.("");
  options.setStripeCustomerEmail?.(DEFAULT_STRIPE_SIM_FORM.customerEmail);
  options.setStripeCardLast4?.(DEFAULT_STRIPE_SIM_FORM.cardLast4);
  options.setStripeSubscriptionId?.("sub_demo_001");
  options.setStripeCancelReason?.("customer_requested");
  options.setBillingPolicy?.(null);
  options.setBillingProviderStatus?.(null);
  options.setSubscriptionState?.(null);
  options.setBillingLedger([]);
  options.setTemplates([]);
  options.setSelectedTemplateId("");
  options.setProposalPdfResult("");
  options.setEstimateExportResult("");
  options.setLlmSuggestion(null);
  options.setLlmSuggestedPrice("");
  options.setCatalogOpsOutput("");
  options.setActivitySummary(null);
  options.setAuditTrail([]);
  options.setLastSnapshot(null);
  options.setSnapshotStatus(DEFAULT_SNAPSHOT_STATUS);
  options.setAdminResultNone();
}
