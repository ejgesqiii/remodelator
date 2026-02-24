import { apiRequest } from "./api";
import { LlmSuggestion } from "../types";

type RequestHeaders = Record<string, string>;

type RunWithSession = (
  label: string,
  blockedMessage: string,
  action: (headers: RequestHeaders) => Promise<void>,
) => Promise<void>;

type RunWithEstimateLine = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  noLineMessage: string,
  action: (headers: RequestHeaders, estimateId: string, lineItemId: string) => Promise<void>,
) => Promise<void>;

type SuggestableLine = {
  item_name: string;
  unit_price: string;
} | null;

type CreateLlmActionsOptions = {
  runWithSession: RunWithSession;
  runWithEstimateLine: RunWithEstimateLine;
  llmReadyForLive: boolean;
  llmBlockerReason: string;
  llmContext: string;
  llmSuggestedPrice: string;
  selectedLine: SuggestableLine;
  pushLog: (line: string) => void;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
  loadLlmStatus: () => Promise<void>;
  setLlmSuggestedPrice: (value: string) => void;
  setLlmSuggestion: (value: LlmSuggestion) => void;
};

export function createLlmActions(options: CreateLlmActionsOptions) {
  const onSuggestLlm = async () => {
    if (!options.llmReadyForLive) {
      const detail = options.llmBlockerReason.trim() || "OpenRouter is not ready.";
      options.pushLog(`LLM suggest blocked: ${detail}`);
      return;
    }

    if (!options.selectedLine) {
      options.pushLog("LLM suggest blocked: select a line item first");
      return;
    }

    await options.runWithSession("LLM suggest (OpenRouter required)", "LLM suggest blocked: login required", async (headers) => {
      const suggestion = await apiRequest<LlmSuggestion>(
        "/pricing/llm/live",
        {
          method: "POST",
          body: JSON.stringify({
            item_name: options.selectedLine?.item_name,
            current_unit_price: options.selectedLine?.unit_price,
            context: options.llmContext,
          }),
        },
        headers,
      );
      options.setLlmSuggestedPrice(suggestion.suggested_unit_price);
      options.setLlmSuggestion(suggestion);
      await options.loadLlmStatus();
    });
  };

  const onApplyLlmSuggestion = async () => {
    if (!options.llmSuggestedPrice.trim()) {
      options.pushLog("LLM apply blocked: missing estimate/line/suggested price");
      return;
    }

    await options.runWithEstimateLine(
      "LLM apply",
      "LLM apply blocked: login required",
      "LLM apply blocked: missing estimate/line/suggested price",
      "LLM apply blocked: missing estimate/line/suggested price",
      async (headers, estimateId, lineItemId) => {
        await apiRequest(
          "/pricing/llm/apply",
          {
            method: "POST",
            body: JSON.stringify({
              estimate_id: estimateId,
              line_item_id: lineItemId,
              suggested_price: options.llmSuggestedPrice.trim(),
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  return {
    onSuggestLlm,
    onApplyLlmSuggestion,
  };
}
