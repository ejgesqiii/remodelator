import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";
import { createDataLoaders } from "./dataLoaders";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

type LoaderOptions = Parameters<typeof createDataLoaders>[0];

function buildOptions(overrides: Partial<LoaderOptions> = {}): LoaderOptions {
  return {
    isSessionReady: true,
    authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
    setCatalogTree: vi.fn(),
    setLlmStatus: vi.fn(),
    setLlmReadyForLive: vi.fn(),
    setLlmBlockerReason: vi.fn(),
    formatLlmStatus: vi.fn(() => "ready"),
    setEstimates: vi.fn(),
    setSelectedEstimate: vi.fn(),
    setSelectedEstimateId: vi.fn(),
    setBillingLedger: vi.fn(),
    setBillingPolicy: vi.fn(),
    setBillingProviderStatus: vi.fn(),
    setBillingAmount: vi.fn(),
    setBillingDetails: vi.fn(),
    setSubscriptionState: vi.fn(),
    setTemplates: vi.fn(),
    setSelectedTemplateId: vi.fn(),
    setProfileFullName: vi.fn(),
    setProfileRole: vi.fn(),
    setProfileLaborRate: vi.fn(),
    setProfileItemMarkupPct: vi.fn(),
    setProfileEstimateMarkupPct: vi.fn(),
    setProfileTaxRatePct: vi.fn(),
    setProfileStatus: vi.fn(),
    defaultProfileStatus: "Profile not loaded.",
    defaultProfileRole: "user",
    setActivitySummary: vi.fn(),
    setAuditTrail: vi.fn(),
    clearWorkspace: vi.fn(),
    ...overrides,
  };
}

describe("createDataLoaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads estimates when session is ready", async () => {
    const options = buildOptions();
    vi.mocked(apiRequest).mockResolvedValue([{ id: "est-1", title: "Demo" }]);
    const loaders = createDataLoaders(options);

    await loaders.loadEstimates();

    expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
      "/estimates",
      { method: "GET" },
      { "x-session-token": "token-1" },
    );
    expect(options.setEstimates).toHaveBeenCalledWith([{ id: "est-1", title: "Demo" }]);
  });

  it("clears workspace when loading estimates without session", async () => {
    const options = buildOptions({ isSessionReady: false });
    const loaders = createDataLoaders(options);

    await loaders.loadEstimates();

    expect(options.clearWorkspace).toHaveBeenCalled();
    expect(vi.mocked(apiRequest)).not.toHaveBeenCalled();
  });

  it("loads templates and selects first template id", async () => {
    const options = buildOptions();
    vi.mocked(apiRequest).mockResolvedValue([
      { id: "tpl-1", name: "Kitchen", line_item_count: 2, created_at: "2026-01-01" },
    ]);
    const loaders = createDataLoaders(options);

    await loaders.loadTemplates();

    expect(options.setTemplates).toHaveBeenCalledWith([
      { id: "tpl-1", name: "Kitchen", line_item_count: 2, created_at: "2026-01-01" },
    ]);
    expect(options.setSelectedTemplateId).toHaveBeenCalled();
  });

  it("returns formatted llm status on success and error message on failure", async () => {
    const options = buildOptions();
    vi.mocked(apiRequest).mockResolvedValueOnce({
      provider: "openrouter",
      model: "google/gemini-2.5-flash",
      api_key_configured: true,
      live_mode: "required",
      timeout_seconds: 30,
      max_retries: 2,
      max_price_change_pct: "20",
      simulation_available: false,
      ready_for_live: true,
      blocker_reason: null,
    });
    const loaders = createDataLoaders(options);

    await loaders.loadLlmStatus();
    expect(options.setLlmStatus).toHaveBeenCalledWith("ready");
    expect(options.setLlmReadyForLive).toHaveBeenCalledWith(true);
    expect(options.setLlmBlockerReason).toHaveBeenCalledWith("");

    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("timeout"));
    await loaders.loadLlmStatus();
    expect(options.setLlmStatus).toHaveBeenCalledWith("LLM status unavailable: timeout");
    expect(options.setLlmReadyForLive).toHaveBeenCalledWith(false);
    expect(options.setLlmBlockerReason).toHaveBeenCalledWith("timeout");
  });
});
