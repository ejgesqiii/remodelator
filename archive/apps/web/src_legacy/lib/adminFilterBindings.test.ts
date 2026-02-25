import { describe, expect, it, vi } from "vitest";

import { createAdminFilterBindings } from "./adminFilterBindings";

describe("createAdminFilterBindings", () => {
  it("updates limit and falls back to default when empty", () => {
    const setAdminFilters = vi.fn((updater) => updater({
      limit: "200",
      userSearch: "",
      userId: "",
      activityAction: "",
      activityEntityType: "",
      billingEventType: "",
      auditPruneRetentionDays: "365",
    }));
    const bindings = createAdminFilterBindings(setAdminFilters);

    bindings.setAdminLimit("25");
    expect(setAdminFilters).toHaveBeenCalled();

    const firstUpdater = setAdminFilters.mock.calls[0][0];
    expect(firstUpdater({
      limit: "200",
      userSearch: "",
      userId: "",
      activityAction: "",
      activityEntityType: "",
      billingEventType: "",
      auditPruneRetentionDays: "365",
    }).limit).toBe("25");

    bindings.setAdminLimit("");
    const secondUpdater = setAdminFilters.mock.calls[1][0];
    expect(secondUpdater({
      limit: "200",
      userSearch: "",
      userId: "",
      activityAction: "",
      activityEntityType: "",
      billingEventType: "",
      auditPruneRetentionDays: "365",
    }).limit).toBe("200");
  });

  it("updates scoped filters independently", () => {
    const setAdminFilters = vi.fn();
    const bindings = createAdminFilterBindings(setAdminFilters);

    bindings.setAdminUserSearch("alpha@example.com");
    bindings.setAdminUserIdFilter("user-1");
    bindings.setAdminActivityActionFilter("estimate.create");
    bindings.setAdminActivityEntityTypeFilter("estimate");
    bindings.setAdminBillingEventTypeFilter("subscription");
    bindings.setAdminAuditPruneRetentionDays("90");

    expect(setAdminFilters).toHaveBeenCalledTimes(6);
  });
});
