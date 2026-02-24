import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";
import { createProfileActions } from "./profileActions";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

type ProfileActionOptions = Parameters<typeof createProfileActions>[0];

function buildOptions(overrides: Partial<ProfileActionOptions> = {}): ProfileActionOptions {
  return {
    runWithSession: vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    }),
    profileFullName: "Demo User",
    profileLaborRate: "65.00",
    profileItemMarkupPct: "8",
    profileEstimateMarkupPct: "10",
    profileTaxRatePct: "8.25",
    decimalOrZero: vi.fn((value: string) => value),
    setProfileFullName: vi.fn(),
    setProfileRole: vi.fn(),
    setProfileLaborRate: vi.fn(),
    setProfileItemMarkupPct: vi.fn(),
    setProfileEstimateMarkupPct: vi.fn(),
    setProfileTaxRatePct: vi.fn(),
    setProfileStatus: vi.fn(),
    loadProfile: vi.fn(async () => {}),
    loadActivityAndAudit: vi.fn(async () => {}),
    setLastSnapshot: vi.fn(),
    setSnapshotStatus: vi.fn(),
    lastSnapshot: null,
    refreshEstimateViews: vi.fn(async () => {}),
    selectedEstimateId: "est-1",
    pushLog: vi.fn(),
    ...overrides,
  };
}

describe("createProfileActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads profile through guarded session runner", async () => {
    const options = buildOptions();
    const actions = createProfileActions(options);

    await actions.onLoadProfile();

    expect(options.loadProfile).toHaveBeenCalled();
  });

  it("saves profile defaults and updates local form state", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      id: "user-1",
      email: "demo@example.com",
      role: "admin",
      full_name: "Updated User",
      labor_rate: "70.00",
      default_item_markup_pct: "9",
      default_estimate_markup_pct: "11",
      tax_rate_pct: "8.50",
    });
    const options = buildOptions();
    const actions = createProfileActions(options);

    await actions.onSaveProfile();

    expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
      "/profile",
      {
        method: "PUT",
        body: JSON.stringify({
          full_name: "Demo User",
          labor_rate: "65.00",
          item_markup_pct: "8",
          estimate_markup_pct: "10",
          tax_rate_pct: "8.25",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(options.setProfileFullName).toHaveBeenCalledWith("Updated User");
    expect(options.setProfileRole).toHaveBeenCalledWith("admin");
    expect(options.setProfileLaborRate).toHaveBeenCalledWith("70.00");
    expect(options.setProfileItemMarkupPct).toHaveBeenCalledWith("9");
    expect(options.setProfileEstimateMarkupPct).toHaveBeenCalledWith("11");
    expect(options.setProfileTaxRatePct).toHaveBeenCalledWith("8.50");
    expect(options.setProfileStatus).toHaveBeenCalledWith("Profile defaults saved.");
  });

  it("refreshes activity through guarded session runner", async () => {
    const options = buildOptions();
    const actions = createProfileActions(options);

    await actions.onRefreshActivity();

    expect(options.loadActivityAndAudit).toHaveBeenCalled();
  });

  it("blocks snapshot restore when no export payload is available", async () => {
    const options = buildOptions({ lastSnapshot: null });
    const actions = createProfileActions(options);

    await actions.onRestoreSnapshot();

    expect(options.pushLog).toHaveBeenCalledWith("Snapshot restore blocked: export snapshot first");
    expect(options.runWithSession).not.toHaveBeenCalled();
  });
});
