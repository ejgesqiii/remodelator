import { useState } from "react";

import { DEFAULT_LLM_CONTEXT, DEFAULT_LLM_STATUS } from "./defaults";
import { LlmSuggestion } from "../types";

export function useLlmState() {
  const [llmStatus, setLlmStatus] = useState(DEFAULT_LLM_STATUS);
  const [llmReadyForLive, setLlmReadyForLive] = useState(false);
  const [llmBlockerReason, setLlmBlockerReason] = useState("");
  const [llmContext, setLlmContext] = useState(DEFAULT_LLM_CONTEXT);
  const [llmSuggestedPrice, setLlmSuggestedPrice] = useState("");
  const [llmSuggestion, setLlmSuggestion] = useState<LlmSuggestion | null>(null);

  return {
    llmStatus,
    setLlmStatus,
    llmReadyForLive,
    setLlmReadyForLive,
    llmBlockerReason,
    setLlmBlockerReason,
    llmContext,
    setLlmContext,
    llmSuggestedPrice,
    setLlmSuggestedPrice,
    llmSuggestion,
    setLlmSuggestion,
  };
}
