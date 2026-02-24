import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLlmState } from "./useLlmState";

describe("useLlmState", () => {
  it("starts with expected llm defaults", () => {
    const { result } = renderHook(() => useLlmState());

    expect(result.current.llmStatus).toContain("loading");
    expect(result.current.llmReadyForLive).toBe(false);
    expect(result.current.llmBlockerReason).toBe("");
    expect(result.current.llmContext).toContain("Mid-range");
    expect(result.current.llmSuggestedPrice).toBe("");
    expect(result.current.llmSuggestion).toBeNull();
  });
});
