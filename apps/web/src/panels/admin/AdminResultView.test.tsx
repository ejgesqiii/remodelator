import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminResultView } from "./AdminResultView";

describe("AdminResultView", () => {
  it("renders default empty state", () => {
    render(<AdminResultView adminResult={{ kind: "none" }} />);
    expect(screen.getByText("No admin query run.")).toBeInTheDocument();
  });

  it("renders summary stats", () => {
    render(
      <AdminResultView
        adminResult={{
          kind: "summary",
          payload: {
            users: 1,
            estimates: 2,
            line_items: 3,
            billing_events: 4,
            billing_total_amount: "120.00",
            catalog_nodes: 5,
            catalog_items: 6,
          },
        }}
      />,
    );

    expect(screen.getByText("Billing Total")).toBeInTheDocument();
    expect(screen.getByText("120.00")).toBeInTheDocument();
  });

  it("renders user metadata rows", () => {
    render(
      <AdminResultView
        adminResult={{
          kind: "users",
          payload: [
            {
              id: "u1",
              email: "owner@example.com",
              role: "admin",
              full_name: "Owner",
              created_at: new Date().toISOString(),
              estimates_count: 3,
              billing_events_count: 5,
              audit_events_count: 12,
              last_login_at: new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Usage: 3 estimates, 5 billing events, 12 activity events/)).toBeInTheDocument();
    expect(screen.getByText(/Last login:/)).toBeInTheDocument();
    expect(screen.getByText(/Last activity:/)).toBeInTheDocument();
  });

  it("renders audit prune status message", () => {
    render(
      <AdminResultView
        adminResult={{
          kind: "audit-prune",
          payload: {
            message: "Removed 2 audit events older than 365 days.",
            deleted: 2,
            retention_days: 365,
          },
        }}
      />,
    );
    expect(screen.getByText("Removed 2 audit events older than 365 days.")).toBeInTheDocument();
  });

  it("renders audit prune preview status message", () => {
    render(
      <AdminResultView
        adminResult={{
          kind: "audit-prune-preview",
          payload: {
            message: "Would remove 3 audit events older than 90 days.",
            deleted: 3,
            retention_days: 90,
          },
        }}
      />,
    );
    expect(screen.getByText("Would remove 3 audit events older than 90 days.")).toBeInTheDocument();
  });
});
