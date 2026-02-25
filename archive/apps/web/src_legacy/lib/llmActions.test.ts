import { describe, expect, it, vi } from "vitest";
import { createLlmActions } from "./llmActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createLlmActions", () => {
  it("blocks suggest when no line is selected", async () => {
    const pushLog = vi.fn();
    const runWithSession = vi.fn(async () => {});

    const actions = createLlmActions({
      runWithSession,
      runWithEstimateLine: vi.fn(async () => {}),
      llmReadyForLive: true,
      llmBlockerReason: "",
      llmContext: "ctx",
      llmSuggestedPrice: "",
      selectedLine: null,
      pushLog,
      refreshEstimateViews: vi.fn(async () => {}),
      loadLlmStatus: vi.fn(async () => {}),
      setLlmSuggestedPrice: vi.fn(),
      setLlmSuggestion: vi.fn(),
    });

    await actions.onSuggestLlm();

    expect(pushLog).toHaveBeenCalledWith("LLM suggest blocked: select a line item first");
    expect(runWithSession).not.toHaveBeenCalled();
  });

  it("blocks suggest when openrouter is not ready", async () => {
    const pushLog = vi.fn();
    const actions = createLlmActions({
      runWithSession: vi.fn(async () => {}),
      runWithEstimateLine: vi.fn(async () => {}),
      llmReadyForLive: false,
      llmBlockerReason: "OPENROUTER_API_KEY is not set.",
      llmContext: "ctx",
      llmSuggestedPrice: "",
      selectedLine: { item_name: "Countertop Install", unit_price: "85.00" },
      pushLog,
      refreshEstimateViews: vi.fn(async () => {}),
      loadLlmStatus: vi.fn(async () => {}),
      setLlmSuggestedPrice: vi.fn(),
      setLlmSuggestion: vi.fn(),
    });

    await actions.onSuggestLlm();
    expect(pushLog).toHaveBeenCalledWith("LLM suggest blocked: OPENROUTER_API_KEY is not set.");
  });

  it("runs live suggest and applies suggestion", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      item_name: "Countertop Install",
      current_unit_price: "85.00",
      suggested_unit_price: "123.45",
      mode: "live",
    });

    const runWithSession = vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    });
    const setLlmSuggestedPrice = vi.fn();
    const setLlmSuggestion = vi.fn();
    const loadLlmStatus = vi.fn(async () => {});

    const actions = createLlmActions({
      runWithSession,
      runWithEstimateLine: vi.fn(async () => {}),
      llmReadyForLive: true,
      llmBlockerReason: "",
      llmContext: "market context",
      llmSuggestedPrice: "",
      selectedLine: { item_name: "Countertop Install", unit_price: "85.00" },
      pushLog: vi.fn(),
      refreshEstimateViews: vi.fn(async () => {}),
      loadLlmStatus,
      setLlmSuggestedPrice,
      setLlmSuggestion,
    });

    await actions.onSuggestLlm();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/pricing/llm/live",
      {
        method: "POST",
        body: JSON.stringify({
          item_name: "Countertop Install",
          current_unit_price: "85.00",
          context: "market context",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(setLlmSuggestedPrice).toHaveBeenCalledWith("123.45");
    expect(setLlmSuggestion).toHaveBeenCalledWith({
      item_name: "Countertop Install",
      current_unit_price: "85.00",
      suggested_unit_price: "123.45",
      mode: "live",
    });
    expect(loadLlmStatus).toHaveBeenCalled();
  });
});
