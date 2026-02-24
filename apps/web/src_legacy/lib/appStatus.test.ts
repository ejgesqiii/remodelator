import { describe, expect, it } from "vitest";

import { buildExternalBlockers, buildQuickstartCatalogNodes, isQuickstartCatalogReady } from "./appStatus";

describe("appStatus", () => {
  it("builds sorted unique quick-start catalog nodes with fallback when empty", () => {
    expect(
      buildQuickstartCatalogNodes(
        [
          { node_id: "1", name: "Kitchen", items: [{ id: "i1", name: "Countertop" }] },
          { node_id: "2", name: "Bathroom", items: [{ id: "i2", name: "Tile" }] },
          { node_id: "3", name: "Kitchen", items: [{ id: "i3", name: "Sink" }] },
          { node_id: "4", name: "Attic", items: [] },
        ],
        "Bathroom",
      ),
    ).toEqual(["Bathroom", "Kitchen"]);

    expect(buildQuickstartCatalogNodes([], "   ")).toEqual(["Bathroom"]);
  });

  it("detects quick-start readiness from catalog tree content", () => {
    expect(isQuickstartCatalogReady([{ node_id: "1", name: "Kitchen", items: [] }])).toBe(false);
    expect(
      isQuickstartCatalogReady([
        { node_id: "1", name: "Kitchen", items: [] },
        { node_id: "2", name: "Bathroom", items: [{ id: "i2", name: "Tile" }] },
      ]),
    ).toBe(true);
  });

  it("prepends live dependency blockers in priority order", () => {
    const blockers = buildExternalBlockers({
      showLlmBlockerBanner: true,
      llmBlockerMessage: "OPENROUTER_API_KEY is missing.",
      billingBlockerMessage: "Stripe key not configured.",
    });
    expect(blockers[0]).toBe("Stripe blocker: Stripe key not configured.");
    expect(blockers[1]).toBe("OpenRouter blocker: OPENROUTER_API_KEY is missing.");
    expect(blockers.length).toBeGreaterThan(2);
  });
});
