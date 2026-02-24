import { describe, expect, it, vi } from "vitest";
import { createTemplateActions } from "./templateActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createTemplateActions", () => {
  it("saves template and refreshes template list", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ template_id: "tpl-1", name: "Kitchen Base" });

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    });
    const pushLog = vi.fn();
    const loadTemplates = vi.fn(async () => {});

    const actions = createTemplateActions({
      runWithEstimate,
      templateName: "Kitchen Base",
      selectedTemplateId: "",
      pushLog,
      loadTemplates,
      refreshEstimateViews: vi.fn(async () => {}),
      setActivePanel: vi.fn(),
    });

    await actions.onSaveTemplate();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/templates/save",
      {
        method: "POST",
        body: JSON.stringify({ estimate_id: "est-1", name: "Kitchen Base" }),
      },
      { "x-session-token": "token-1" },
    );
    expect(pushLog).toHaveBeenCalledWith("Template saved: Kitchen Base");
    expect(loadTemplates).toHaveBeenCalled();
  });

  it("applies selected template and refreshes estimate views", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({});

    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-2");
    });
    const refreshEstimateViews = vi.fn(async () => {});
    const setActivePanel = vi.fn();

    const actions = createTemplateActions({
      runWithEstimate,
      templateName: "unused",
      selectedTemplateId: "tpl-9",
      pushLog: vi.fn(),
      loadTemplates: vi.fn(async () => {}),
      refreshEstimateViews,
      setActivePanel,
    });

    await actions.onApplyTemplate();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/templates/apply",
      {
        method: "POST",
        body: JSON.stringify({ template_id: "tpl-9", estimate_id: "est-2" }),
      },
      { "x-session-token": "token-1" },
    );
    expect(refreshEstimateViews).toHaveBeenCalledWith("est-2");
    expect(setActivePanel).toHaveBeenCalledWith("workspace");
  });
});
