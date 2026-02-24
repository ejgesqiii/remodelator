import { describe, expect, it, vi } from "vitest";

import { clearWorkspaceState } from "./workspaceReset";

describe("clearWorkspaceState", () => {
  it("resets all workspace slices to clean defaults", () => {
    const setEstimates = vi.fn();
    const setSelectedEstimateId = vi.fn();
    const setSelectedEstimate = vi.fn();
    const setSelectedLineItemId = vi.fn();
    const resetEstimateForm = vi.fn();
    const resetLineItemForm = vi.fn();
    const resetEditLineItemForm = vi.fn();
    const setProposalPreview = vi.fn();
    const setBillingResponse = vi.fn();
    const setBillingLedger = vi.fn();
    const setTemplates = vi.fn();
    const setSelectedTemplateId = vi.fn();
    const setProposalPdfResult = vi.fn();
    const setEstimateExportResult = vi.fn();
    const setLlmSuggestion = vi.fn();
    const setLlmSuggestedPrice = vi.fn();
    const setCatalogOpsOutput = vi.fn();
    const setActivitySummary = vi.fn();
    const setAuditTrail = vi.fn();
    const setLastSnapshot = vi.fn();
    const setSnapshotStatus = vi.fn();
    const setAdminResultNone = vi.fn();

    clearWorkspaceState({
      setEstimates,
      setSelectedEstimateId,
      setSelectedEstimate,
      setSelectedLineItemId,
      resetEstimateForm,
      resetLineItemForm,
      resetEditLineItemForm,
      setProposalPreview,
      setBillingResponse,
      setBillingLedger,
      setTemplates,
      setSelectedTemplateId,
      setProposalPdfResult,
      setEstimateExportResult,
      setLlmSuggestion,
      setLlmSuggestedPrice,
      setCatalogOpsOutput,
      setActivitySummary,
      setAuditTrail,
      setLastSnapshot,
      setSnapshotStatus,
      setAdminResultNone,
    });

    expect(setEstimates).toHaveBeenCalledWith([]);
    expect(setSelectedEstimateId).toHaveBeenCalledWith(null);
    expect(setSelectedEstimate).toHaveBeenCalledWith(null);
    expect(setSelectedLineItemId).toHaveBeenCalledWith("");
    expect(resetEstimateForm).toHaveBeenCalled();
    expect(resetLineItemForm).toHaveBeenCalled();
    expect(resetEditLineItemForm).toHaveBeenCalled();
    expect(setProposalPreview).toHaveBeenCalledWith("");
    expect(setBillingResponse).toHaveBeenCalledWith(null);
    expect(setBillingLedger).toHaveBeenCalledWith([]);
    expect(setTemplates).toHaveBeenCalledWith([]);
    expect(setSelectedTemplateId).toHaveBeenCalledWith("");
    expect(setProposalPdfResult).toHaveBeenCalledWith("");
    expect(setEstimateExportResult).toHaveBeenCalledWith("");
    expect(setLlmSuggestion).toHaveBeenCalledWith(null);
    expect(setLlmSuggestedPrice).toHaveBeenCalledWith("");
    expect(setCatalogOpsOutput).toHaveBeenCalledWith("");
    expect(setActivitySummary).toHaveBeenCalledWith(null);
    expect(setAuditTrail).toHaveBeenCalledWith([]);
    expect(setLastSnapshot).toHaveBeenCalledWith(null);
    expect(setSnapshotStatus).toHaveBeenCalledWith("");
    expect(setAdminResultNone).toHaveBeenCalled();
  });
});
