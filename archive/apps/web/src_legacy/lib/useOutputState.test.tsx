import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useOutputState } from "./useOutputState";

describe("useOutputState", () => {
  it("starts with expected defaults", () => {
    const { result } = renderHook(() => useOutputState());

    expect(result.current.billingAmount).toBe("1200.00");
    expect(result.current.billingDetails).toBe("annual subscription simulation");
    expect(result.current.stripeCardLast4).toBe("4242");
    expect(result.current.stripeSubscriptionId).toBe("sub_demo_001");
    expect(result.current.statusTarget).toBe("in_progress");
    expect(result.current.proposalPdfPath).toBe("");
    expect(result.current.proposalPreview).toBe("");
    expect(result.current.billingPolicy).toBeNull();
    expect(result.current.billingProviderStatus).toBeNull();
    expect(result.current.subscriptionState).toBeNull();
    expect(result.current.billingResponse).toBeNull();
  });
});
