import { describe, expect, it, vi } from "vitest";
import { createEstimateActions } from "./estimateActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createEstimateActions", () => {
  it("runs status update action", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({});

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    });
    const refreshEstimateViews = vi.fn(async () => {});

    const { onEstimateAction } = createEstimateActions({
      runWithEstimate,
      statusTarget: "in_progress",
      setSelectedEstimateId: vi.fn(),
      refreshEstimateViews,
    });

    await onEstimateAction("status");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/estimates/est-1/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "in_progress" }),
      },
      { "x-session-token": "token-1" },
    );
    expect(refreshEstimateViews).toHaveBeenCalledWith("est-1");
  });

  it("runs duplicate action and updates selected estimate id", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ id: "est-2" });

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    });
    const setSelectedEstimateId = vi.fn();
    const refreshEstimateViews = vi.fn(async () => {});

    const { onEstimateAction } = createEstimateActions({
      runWithEstimate,
      statusTarget: "draft",
      setSelectedEstimateId,
      refreshEstimateViews,
    });

    await onEstimateAction("duplicate");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/estimates/est-1/duplicate",
      { method: "POST" },
      { "x-session-token": "token-1" },
    );
    expect(setSelectedEstimateId).toHaveBeenCalledWith("est-2");
    expect(refreshEstimateViews).toHaveBeenCalledWith("est-2");
  });
});
