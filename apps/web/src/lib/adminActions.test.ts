import { describe, expect, it, vi } from "vitest";
import { createAdminActions } from "./adminActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createAdminActions", () => {
  it("runs summary request and stores structured output", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ users: 3 });

    const run = vi.fn(async (_label: string, action: () => Promise<void>) => {
      await action();
    });
    const setAdminResult = vi.fn();

    const { onAdminRequest } = createAdminActions({
      run,
      adminKey: "local-admin-key",
      isSessionAdmin: false,
      adminFilters: {
        limit: "200",
        userSearch: "",
        userId: "",
        activityAction: "",
        activityEntityType: "",
        billingEventType: "",
        auditPruneRetentionDays: "365",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey: vi.fn(),
      setAdminResult,
      clearLogs: vi.fn(),
      persistSession: vi.fn(),
      clearWorkspace: vi.fn(),
      resetProfileForm: vi.fn(),
      loadCatalogTree: vi.fn(async () => {}),
      pushLog: vi.fn(),
    });

    await onAdminRequest("summary");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/admin/summary",
      { method: "GET" },
      { "x-session-token": "token-1", "x-admin-key": "local-admin-key" },
    );
    expect(setAdminResult).toHaveBeenCalledWith({ kind: "summary", payload: { users: 3 } });
  });

  it("runs demo reset flow and triggers local cleanup callbacks", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ status: "ok", seeded: { nodes: 7, items: 7 } });

    const run = vi.fn(async (_label: string, action: () => Promise<void>) => {
      await action();
    });
    const persistAdminKey = vi.fn();
    const clearLogs = vi.fn();
    const persistSession = vi.fn();
    const clearWorkspace = vi.fn();
    const resetProfileForm = vi.fn();
    const loadCatalogTree = vi.fn(async () => {});
    const pushLog = vi.fn();
    const setAdminResult = vi.fn();

    const { onAdminRequest } = createAdminActions({
      run,
      adminKey: "local-admin-key",
      isSessionAdmin: false,
      adminFilters: {
        limit: "200",
        userSearch: "",
        userId: "",
        activityAction: "",
        activityEntityType: "",
        billingEventType: "",
        auditPruneRetentionDays: "365",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey,
      setAdminResult,
      clearLogs,
      persistSession,
      clearWorkspace,
      resetProfileForm,
      loadCatalogTree,
      pushLog,
    });

    await onAdminRequest("demo-reset");

    expect(persistAdminKey).toHaveBeenCalled();
    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/admin/demo-reset",
      { method: "POST" },
      { "x-admin-key": "local-admin-key" },
    );
    expect(setAdminResult).toHaveBeenCalledWith({ kind: "demo-reset", payload: { message: "Demo reset complete." } });
    expect(clearLogs).toHaveBeenCalled();
    expect(persistSession).toHaveBeenCalledWith(null);
    expect(clearWorkspace).toHaveBeenCalled();
    expect(resetProfileForm).toHaveBeenCalled();
    expect(loadCatalogTree).toHaveBeenCalled();
    expect(pushLog).toHaveBeenCalledWith("Database reset complete; session cleared");
  });

  it("runs audit prune preview flow with admin key", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ status: "ok", deleted: 4, retention_days: 365, dry_run: true });

    const setAdminResult = vi.fn();
    const pushLog = vi.fn();

    const { onAdminRequest } = createAdminActions({
      run: vi.fn(async (_label, action) => {
        await action();
      }),
      adminKey: "local-admin-key",
      isSessionAdmin: false,
      adminFilters: {
        limit: "200",
        userSearch: "",
        userId: "",
        activityAction: "",
        activityEntityType: "",
        billingEventType: "",
        auditPruneRetentionDays: "90",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey: vi.fn(),
      setAdminResult,
      clearLogs: vi.fn(),
      persistSession: vi.fn(),
      clearWorkspace: vi.fn(),
      resetProfileForm: vi.fn(),
      loadCatalogTree: vi.fn(async () => {}),
      pushLog,
    });

    await onAdminRequest("audit-prune-preview");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/admin/audit-prune?retention_days=90&dry_run=true",
      { method: "POST" },
      { "x-admin-key": "local-admin-key" },
    );
    expect(setAdminResult).toHaveBeenCalledWith({
      kind: "audit-prune-preview",
      payload: {
        message: "Would remove 4 audit events older than 365 days.",
        deleted: 4,
        retention_days: 365,
      },
    });
    expect(pushLog).toHaveBeenCalledWith("Audit prune preview: deleted=4, retention_days=365");
  });

  it("runs audit prune execute flow with admin key", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({ status: "ok", deleted: 2, retention_days: 365, dry_run: false });

    const setAdminResult = vi.fn();
    const pushLog = vi.fn();

    const { onAdminRequest } = createAdminActions({
      run: vi.fn(async (_label, action) => {
        await action();
      }),
      adminKey: "local-admin-key",
      isSessionAdmin: false,
      adminFilters: {
        limit: "200",
        userSearch: "",
        userId: "",
        activityAction: "",
        activityEntityType: "",
        billingEventType: "",
        auditPruneRetentionDays: "365",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey: vi.fn(),
      setAdminResult,
      clearLogs: vi.fn(),
      persistSession: vi.fn(),
      clearWorkspace: vi.fn(),
      resetProfileForm: vi.fn(),
      loadCatalogTree: vi.fn(async () => {}),
      pushLog,
    });

    await onAdminRequest("audit-prune");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/admin/audit-prune?retention_days=365&dry_run=false",
      { method: "POST" },
      { "x-admin-key": "local-admin-key" },
    );
    expect(setAdminResult).toHaveBeenCalledWith({
      kind: "audit-prune",
      payload: {
        message: "Removed 2 audit events older than 365 days.",
        deleted: 2,
        retention_days: 365,
      },
    });
    expect(pushLog).toHaveBeenCalledWith("Audit prune complete: deleted=2, retention_days=365");
  });

  it("allows admin reads via session role without admin key", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue([{ id: "u-1", email: "admin@example.com", role: "admin", full_name: "", created_at: "2026-01-01" }]);

    const { onAdminRequest } = createAdminActions({
      run: vi.fn(async (_label, action) => {
        await action();
      }),
      adminKey: "",
      isSessionAdmin: true,
      adminFilters: {
        limit: "200",
        userSearch: "",
        userId: "",
        activityAction: "",
        activityEntityType: "",
        billingEventType: "",
        auditPruneRetentionDays: "365",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey: vi.fn(),
      setAdminResult: vi.fn(),
      clearLogs: vi.fn(),
      persistSession: vi.fn(),
      clearWorkspace: vi.fn(),
      resetProfileForm: vi.fn(),
      loadCatalogTree: vi.fn(async () => {}),
      pushLog: vi.fn(),
    });

    await onAdminRequest("users");

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/admin/users?limit=200",
      { method: "GET" },
      { "x-session-token": "token-1" },
    );
  });

  it("applies activity and billing filters to querystring", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue([]);

    const { onAdminRequest } = createAdminActions({
      run: vi.fn(async (_label, action) => {
        await action();
      }),
      adminKey: "local-admin-key",
      isSessionAdmin: false,
      adminFilters: {
        limit: "25",
        userSearch: "demo@example.com",
        userId: "user-1",
        activityAction: "estimate.create",
        activityEntityType: "estimate",
        billingEventType: "subscription",
        auditPruneRetentionDays: "365",
      },
      authHeaders: vi.fn(() => ({ "x-session-token": "token-1" })),
      persistAdminKey: vi.fn(),
      setAdminResult: vi.fn(),
      clearLogs: vi.fn(),
      persistSession: vi.fn(),
      clearWorkspace: vi.fn(),
      resetProfileForm: vi.fn(),
      loadCatalogTree: vi.fn(async () => {}),
      pushLog: vi.fn(),
    });

    await onAdminRequest("activity");
    expect(mockedApiRequest).toHaveBeenLastCalledWith(
      "/admin/activity?limit=25&user_id=user-1&action=estimate.create&entity_type=estimate",
      { method: "GET" },
      { "x-session-token": "token-1", "x-admin-key": "local-admin-key" },
    );

    await onAdminRequest("billing-ledger");
    expect(mockedApiRequest).toHaveBeenLastCalledWith(
      "/admin/billing-ledger?limit=25&user_id=user-1&event_type=subscription",
      { method: "GET" },
      { "x-session-token": "token-1", "x-admin-key": "local-admin-key" },
    );
  });
});
