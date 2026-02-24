import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSessionBootstrap } from "./useSessionBootstrap";

type HookOptions = Parameters<typeof useSessionBootstrap>[0];

function buildOptions(overrides: Partial<HookOptions> = {}): HookOptions {
  return {
    session: null,
    clearWorkspace: vi.fn(),
    resetProfileForm: vi.fn(),
    setActivePanel: vi.fn(),
    loadCatalogTree: vi.fn(async () => {}),
    loadLlmStatus: vi.fn(async () => {}),
    loadBillingPolicy: vi.fn(async () => {}),
    loadBillingProviderStatus: vi.fn(async () => {}),
    loadEstimates: vi.fn(async () => {}),
    loadBillingLedger: vi.fn(async () => {}),
    loadSubscriptionState: vi.fn(async () => {}),
    loadTemplates: vi.fn(async () => {}),
    loadProfile: vi.fn(async () => {}),
    loadActivityAndAudit: vi.fn(async () => {}),
    pushLog: vi.fn(),
    ...overrides,
  };
}

describe("useSessionBootstrap", () => {
  it("runs bootstrap loads and clears workspace when no session", async () => {
    const options = buildOptions({ session: null });
    renderHook(() => useSessionBootstrap(options));

    await waitFor(() => expect(options.loadCatalogTree).toHaveBeenCalled());
    await waitFor(() => expect(options.loadLlmStatus).toHaveBeenCalled());
    await waitFor(() => expect(options.loadBillingPolicy).toHaveBeenCalled());
    await waitFor(() => expect(options.loadBillingProviderStatus).toHaveBeenCalled());
    await waitFor(() => expect(options.clearWorkspace).toHaveBeenCalled());
    expect(options.resetProfileForm).toHaveBeenCalled();
    expect(options.setActivePanel).toHaveBeenCalledWith("session");
    expect(options.loadEstimates).not.toHaveBeenCalled();
  });

  it("loads session-scoped data when session exists", async () => {
    const options = buildOptions({
      session: { email: "demo@example.com", sessionToken: "token-1", role: "user" },
    });
    renderHook(() => useSessionBootstrap(options));

    await waitFor(() => expect(options.loadEstimates).toHaveBeenCalled());
    await waitFor(() => expect(options.loadBillingLedger).toHaveBeenCalled());
    await waitFor(() => expect(options.loadSubscriptionState).toHaveBeenCalled());
    await waitFor(() => expect(options.loadTemplates).toHaveBeenCalled());
    await waitFor(() => expect(options.loadProfile).toHaveBeenCalled());
    await waitFor(() => expect(options.loadActivityAndAudit).toHaveBeenCalled());
    expect(options.pushLog).toHaveBeenCalledWith("Session loaded for demo@example.com");
  });
});
