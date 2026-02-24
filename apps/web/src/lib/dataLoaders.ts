import { apiRequest } from "./api";
import {
  ActivitySummary,
  AuditEntry,
  BillingEvent,
  BillingPolicy,
  BillingProviderStatus,
  BillingSubscriptionState,
  CatalogTreeNode,
  Estimate,
  LlmProviderStatus,
  TemplateSummary,
  UserProfile,
} from "../types";

type CreateDataLoadersOptions = {
  isSessionReady: boolean;
  authHeaders: () => Record<string, string>;
  setCatalogTree: (nodes: CatalogTreeNode[]) => void;
  setLlmStatus: (value: string) => void;
  setLlmReadyForLive: (value: boolean) => void;
  setLlmBlockerReason: (value: string) => void;
  formatLlmStatus: (value: LlmProviderStatus) => string;
  setEstimates: (items: Estimate[]) => void;
  setSelectedEstimate: (estimate: Estimate) => void;
  setSelectedEstimateId: (id: string) => void;
  setBillingLedger: (items: BillingEvent[]) => void;
  setBillingPolicy: (value: BillingPolicy | null) => void;
  setBillingProviderStatus: (value: BillingProviderStatus | null) => void;
  setBillingAmount: (value: string) => void;
  setBillingDetails: (value: string) => void;
  setSubscriptionState: (value: BillingSubscriptionState | null) => void;
  setTemplates: (rows: TemplateSummary[]) => void;
  setSelectedTemplateId: (value: string | ((current: string) => string)) => void;
  setProfileFullName: (value: string) => void;
  setProfileRole: (value: string) => void;
  setProfileLaborRate: (value: string) => void;
  setProfileItemMarkupPct: (value: string) => void;
  setProfileEstimateMarkupPct: (value: string) => void;
  setProfileTaxRatePct: (value: string) => void;
  setProfileStatus: (value: string) => void;
  defaultProfileStatus: string;
  defaultProfileRole: string;
  setActivitySummary: (value: ActivitySummary | null) => void;
  setAuditTrail: (value: AuditEntry[]) => void;
  clearWorkspace: () => void;
};

export function createDataLoaders(options: CreateDataLoadersOptions) {
  const loadCatalogTree = async () => {
    const nodes = await apiRequest<CatalogTreeNode[]>("/catalog/tree", { method: "GET" });
    options.setCatalogTree(nodes);
  };

  const loadLlmStatus = async () => {
    try {
      const status = await apiRequest<LlmProviderStatus>("/pricing/llm/status", { method: "GET" });
      options.setLlmStatus(options.formatLlmStatus(status));
      options.setLlmReadyForLive(status.ready_for_live);
      options.setLlmBlockerReason(status.blocker_reason ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.setLlmStatus(`LLM status unavailable: ${message}`);
      options.setLlmReadyForLive(false);
      options.setLlmBlockerReason(message);
    }
  };

  const loadEstimates = async () => {
    if (!options.isSessionReady) {
      options.clearWorkspace();
      return;
    }
    const headers = options.authHeaders();
    const items = await apiRequest<Estimate[]>("/estimates", { method: "GET" }, headers);
    options.setEstimates(items);
  };

  const loadEstimate = async (estimateId: string) => {
    if (!options.isSessionReady) {
      return;
    }
    const headers = options.authHeaders();
    const est = await apiRequest<Estimate>(`/estimates/${estimateId}`, { method: "GET" }, headers);
    options.setSelectedEstimate(est);
    options.setSelectedEstimateId(est.id);
  };

  const refreshEstimateViews = async (estimateId: string | null) => {
    await loadEstimates();
    if (estimateId) {
      await loadEstimate(estimateId);
    }
  };

  const loadBillingLedger = async () => {
    if (!options.isSessionReady) {
      options.setBillingLedger([]);
      return;
    }
    const headers = options.authHeaders();
    const ledger = await apiRequest<BillingEvent[]>("/billing/ledger?limit=20", { method: "GET" }, headers);
    options.setBillingLedger(ledger);
  };

  const loadBillingPolicy = async () => {
    const policy = await apiRequest<BillingPolicy>("/billing/policy", { method: "GET" });
    options.setBillingPolicy(policy);
    options.setBillingAmount(policy.annual_subscription_amount);
    options.setBillingDetails("annual subscription simulation");
  };

  const loadBillingProviderStatus = async () => {
    if (!options.isSessionReady) {
      options.setBillingProviderStatus(null);
      return;
    }
    const headers = options.authHeaders();
    const status = await apiRequest<BillingProviderStatus>("/billing/provider-status", { method: "GET" }, headers);
    options.setBillingProviderStatus(status);
  };

  const loadSubscriptionState = async () => {
    if (!options.isSessionReady) {
      options.setSubscriptionState(null);
      return;
    }
    const headers = options.authHeaders();
    const state = await apiRequest<BillingSubscriptionState>("/billing/subscription-state", { method: "GET" }, headers);
    options.setSubscriptionState(state);
  };

  const loadTemplates = async () => {
    if (!options.isSessionReady) {
      options.setTemplates([]);
      options.setSelectedTemplateId("");
      return;
    }
    const headers = options.authHeaders();
    const rows = await apiRequest<TemplateSummary[]>("/templates?limit=50", { method: "GET" }, headers);
    options.setTemplates(rows);
    options.setSelectedTemplateId((current) => {
      if (current && rows.some((row) => row.id === current)) {
        return current;
      }
      return rows[0]?.id ?? "";
    });
  };

  const loadProfile = async () => {
    if (!options.isSessionReady) {
      options.setProfileRole(options.defaultProfileRole);
      options.setProfileStatus(options.defaultProfileStatus);
      return;
    }
    const headers = options.authHeaders();
    const profile = await apiRequest<UserProfile>("/profile", { method: "GET" }, headers);
    options.setProfileFullName(profile.full_name ?? "");
    options.setProfileRole(profile.role || options.defaultProfileRole);
    options.setProfileLaborRate(profile.labor_rate);
    options.setProfileItemMarkupPct(profile.default_item_markup_pct);
    options.setProfileEstimateMarkupPct(profile.default_estimate_markup_pct);
    options.setProfileTaxRatePct(profile.tax_rate_pct);
    options.setProfileStatus(`Profile loaded for ${profile.email}`);
  };

  const loadActivityAndAudit = async () => {
    if (!options.isSessionReady) {
      options.setActivitySummary(null);
      options.setAuditTrail([]);
      return;
    }
    const headers = options.authHeaders();
    const [activity, audit] = await Promise.all([
      apiRequest<ActivitySummary>("/activity", { method: "GET" }, headers),
      apiRequest<AuditEntry[]>("/audit?limit=25", { method: "GET" }, headers),
    ]);
    options.setActivitySummary(activity);
    options.setAuditTrail(audit);
  };

  return {
    loadCatalogTree,
    loadLlmStatus,
    loadEstimates,
    loadEstimate,
    refreshEstimateViews,
    loadBillingLedger,
    loadBillingPolicy,
    loadBillingProviderStatus,
    loadSubscriptionState,
    loadTemplates,
    loadProfile,
    loadActivityAndAudit,
  };
}
