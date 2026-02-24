import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWorkspaceCoreState } from "./useWorkspaceCoreState";

describe("useWorkspaceCoreState", () => {
  it("starts with empty workspace and session panel active", () => {
    const { result } = renderHook(() => useWorkspaceCoreState());

    expect(result.current.estimates).toEqual([]);
    expect(result.current.selectedEstimateId).toBeNull();
    expect(result.current.selectedEstimate).toBeNull();
    expect(result.current.selectedLineItemId).toBe("");
    expect(result.current.billingLedger).toEqual([]);
    expect(result.current.adminResult).toEqual({ kind: "none" });
    expect(result.current.activePanel).toBe("session");
  });
});
