import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActivityAuditSection } from "./ActivityAuditSection";
import { AuthFormsSection } from "./AuthFormsSection";
import { SnapshotSection } from "./SnapshotSection";

describe("session section components", () => {
  it("renders activity summary metrics and audit entries", () => {
    render(
      <ActivityAuditSection
        busy={false}
        isSessionReady={true}
        activitySummary={{ estimates: 2, line_items: 5, billing_events: 1, audit_events: 4 }}
        auditTrail={[
          {
            id: "evt-1",
            action: "estimate.create",
            entity_type: "estimate",
            entity_id: "est-1",
            created_at: new Date().toISOString(),
          },
        ]}
        onRefreshActivity={vi.fn()}
      />, 
    );

    expect(screen.getByText("Estimates")).toBeInTheDocument();
    expect(screen.getByText("estimate.create")).toBeInTheDocument();
  });

  it("fires snapshot action handlers", () => {
    const onExportSnapshot = vi.fn();
    const onRestoreSnapshot = vi.fn();
    render(
      <SnapshotSection
        busy={false}
        isSessionReady={true}
        snapshotStatus="ready"
        onExportSnapshot={onExportSnapshot}
        onRestoreSnapshot={onRestoreSnapshot}
      />,
    );

    fireEvent.click(screen.getByText("Export Snapshot"));
    fireEvent.click(screen.getByText("Restore Last Snapshot"));

    expect(onExportSnapshot).toHaveBeenCalled();
    expect(onRestoreSnapshot).toHaveBeenCalled();
  });

  it("shows forgot-password deferral notice", () => {
    render(
      <AuthFormsSection
        busy={false}
        registerEmail=""
        setRegisterEmail={vi.fn()}
        registerPassword=""
        setRegisterPassword={vi.fn()}
        registerName=""
        setRegisterName={vi.fn()}
        loginEmail=""
        setLoginEmail={vi.fn()}
        loginPassword=""
        setLoginPassword={vi.fn()}
        onRegister={vi.fn()}
        onLogin={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText(/Forgot password is intentionally deferred/i)).toBeInTheDocument();
  });
});
