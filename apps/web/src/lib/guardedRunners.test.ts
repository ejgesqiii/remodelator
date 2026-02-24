import { describe, expect, it, vi } from "vitest";
import { createGuardedRunners } from "./guardedRunners";

describe("createGuardedRunners", () => {
  it("blocks session-protected actions when no session is present", async () => {
    const pushLog = vi.fn();
    const run = vi.fn(async (_label: string, action: () => Promise<void>) => {
      await action();
    });
    const action = vi.fn(async () => {});

    const runners = createGuardedRunners({
      isSessionReady: false,
      selectedEstimateId: null,
      selectedLineItemId: "",
      pushLog,
      run,
      authHeaders: () => ({}),
    });

    await runners.runWithSession("Load profile", "login required", action);

    expect(pushLog).toHaveBeenCalledWith("login required");
    expect(run).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it("blocks estimate-protected actions when no estimate is selected", async () => {
    const pushLog = vi.fn();
    const run = vi.fn(async (_label: string, action: () => Promise<void>) => {
      await action();
    });
    const action = vi.fn(async () => {});

    const runners = createGuardedRunners({
      isSessionReady: true,
      selectedEstimateId: null,
      selectedLineItemId: "",
      pushLog,
      run,
      authHeaders: () => ({ "x-session-token": "token" }),
    });

    await runners.runWithEstimate("Render proposal", "login required", "select estimate", action);

    expect(pushLog).toHaveBeenCalledWith("select estimate");
    expect(action).not.toHaveBeenCalled();
  });

  it("runs line-protected actions with resolved ids and headers", async () => {
    const pushLog = vi.fn();
    const run = vi.fn(async (_label: string, action: () => Promise<void>) => {
      await action();
    });
    const action = vi.fn(async () => {});

    const runners = createGuardedRunners({
      isSessionReady: true,
      selectedEstimateId: "est-1",
      selectedLineItemId: "line-1",
      pushLog,
      run,
      authHeaders: () => ({ "x-session-token": "token" }),
    });

    await runners.runWithEstimateLine("Update line", "login required", "select estimate", "select line", action);

    expect(action).toHaveBeenCalledWith({ "x-session-token": "token" }, "est-1", "line-1");
    expect(pushLog).not.toHaveBeenCalled();
  });
});
