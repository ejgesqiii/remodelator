import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPanel } from "./AdminPanel";

describe("AdminPanel", () => {
  it("renders summary metrics when summary result is active", () => {
    render(
      <AdminPanel
        busy={false}
        sessionEmail="admin@example.com"
        isSessionAdmin={true}
        adminKey="local-admin-key"
        setAdminKey={() => {}}
        adminFilters={{
          limit: "200",
          userSearch: "",
          userId: "",
          activityAction: "",
          activityEntityType: "",
          billingEventType: "",
          auditPruneRetentionDays: "365",
        }}
        setAdminLimit={() => {}}
        setAdminUserSearch={() => {}}
        setAdminUserIdFilter={() => {}}
        setAdminActivityActionFilter={() => {}}
        setAdminActivityEntityTypeFilter={() => {}}
        setAdminBillingEventTypeFilter={() => {}}
        setAdminAuditPruneRetentionDays={() => {}}
        adminResult={{
          kind: "summary",
          payload: {
            users: 2,
            estimates: 5,
            line_items: 12,
            billing_events: 3,
            billing_total_amount: "149.50",
            catalog_nodes: 7,
            catalog_items: 20,
          },
        }}
        logLines={[]}
        demoChecklist={["Sign in", "Create estimate"]}
        externalBlockers={["Confirm pricing fixtures"]}
        onAdminRequest={vi.fn()}
      />,
    );

    expect(screen.getByText("Billing Total")).toBeVisible();
    expect(screen.getByText("149.50")).toBeVisible();
    expect(screen.getByText("7 / 20")).toBeVisible();
  });

  it("renders empty state before first admin query", () => {
    render(
      <AdminPanel
        busy={false}
        sessionEmail={null}
        isSessionAdmin={false}
        adminKey=""
        setAdminKey={() => {}}
        adminFilters={{
          limit: "200",
          userSearch: "",
          userId: "",
          activityAction: "",
          activityEntityType: "",
          billingEventType: "",
          auditPruneRetentionDays: "365",
        }}
        setAdminLimit={() => {}}
        setAdminUserSearch={() => {}}
        setAdminUserIdFilter={() => {}}
        setAdminActivityActionFilter={() => {}}
        setAdminActivityEntityTypeFilter={() => {}}
        setAdminBillingEventTypeFilter={() => {}}
        setAdminAuditPruneRetentionDays={() => {}}
        adminResult={{ kind: "none" }}
        logLines={[]}
        demoChecklist={["Sign in", "Create estimate"]}
        externalBlockers={["Confirm pricing fixtures"]}
        onAdminRequest={vi.fn()}
      />,
    );

    expect(screen.getByText("No admin query run.")).toBeVisible();
    expect(screen.getByText("Demo Walkthrough Checklist")).toBeVisible();
    expect(screen.getByText("External Inputs Still Needed")).toBeVisible();
  });
});
