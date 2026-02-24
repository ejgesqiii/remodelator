import { describe, expect, it, vi } from "vitest";
import { createProposalActions } from "./proposalActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createProposalActions", () => {
  it("renders proposal and switches to output panel", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ rendered: "Proposal body" });

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    });
    const setProposalPreview = vi.fn();
    const setActivePanel = vi.fn();

    const actions = createProposalActions({
      runWithEstimate,
      proposalPdfPath: "",
      estimateExportPath: "",
      setProposalPreview,
      setProposalPdfResult: vi.fn(),
      setProposalPdfPath: vi.fn(),
      setEstimateExportResult: vi.fn(),
      setEstimateExportPath: vi.fn(),
      setActivePanel,
    });

    await actions.onRenderProposal();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/proposals/est-1/render",
      { method: "GET" },
      { "x-session-token": "token-1" },
    );
    expect(setProposalPreview).toHaveBeenCalledWith("Proposal body");
    expect(setActivePanel).toHaveBeenCalledWith("output");
  });

  it("exports estimate JSON with default path when empty", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ path: "data/demo_outputs/estimate_est-9.json" });

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-9");
    });
    const setEstimateExportResult = vi.fn();
    const setEstimateExportPath = vi.fn();

    const actions = createProposalActions({
      runWithEstimate,
      proposalPdfPath: "",
      estimateExportPath: "",
      setProposalPreview: vi.fn(),
      setProposalPdfResult: vi.fn(),
      setProposalPdfPath: vi.fn(),
      setEstimateExportResult,
      setEstimateExportPath,
      setActivePanel: vi.fn(),
    });

    await actions.onExportEstimateJson();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/estimates/est-9/export",
      {
        method: "POST",
        body: JSON.stringify({ output_path: "data/demo_outputs/estimate_est-9.json" }),
      },
      { "x-session-token": "token-1" },
    );
    expect(setEstimateExportResult).toHaveBeenCalled();
    expect(setEstimateExportPath).toHaveBeenCalledWith("data/demo_outputs/estimate_est-9.json");
  });
});
