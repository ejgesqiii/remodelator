import { apiRequest } from "./api";
import { API_LIMIT_MIN, DEFAULT_ADMIN_FILTERS } from "./defaults";
import { AdminActivityRow, AdminBillingRow, AdminFilters, AdminResult, AdminSummary, AdminUserRow } from "../types";

export type AdminActionKind = "summary" | "users" | "activity" | "billing-ledger" | "audit-prune-preview" | "audit-prune" | "demo-reset";

type RunAction = (label: string, action: () => Promise<void>) => Promise<void>;

type CreateAdminActionsOptions = {
  run: RunAction;
  adminKey: string;
  isSessionAdmin: boolean;
  adminFilters: AdminFilters;
  authHeaders: () => Record<string, string>;
  persistAdminKey: () => void;
  setAdminResult: (value: AdminResult) => void;
  clearLogs: () => void;
  persistSession: (next: null) => void;
  clearWorkspace: () => void;
  resetProfileForm: () => void;
  loadCatalogTree: () => Promise<void>;
  pushLog: (line: string) => void;
};

export function createAdminActions(options: CreateAdminActionsOptions) {
  const parseLimit = (raw: string): number => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      return Number.parseInt(DEFAULT_ADMIN_FILTERS.limit, 10);
    }
    return Math.max(API_LIMIT_MIN, parsed);
  };

  const parseRetentionDays = (raw: string): number => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      return Number.parseInt(DEFAULT_ADMIN_FILTERS.auditPruneRetentionDays, 10);
    }
    return Math.max(1, parsed);
  };

  const buildAdminReadPath = (kind: Exclude<AdminActionKind, "demo-reset" | "audit-prune" | "audit-prune-preview" | "summary">): string => {
    const params = new URLSearchParams();
    params.set("limit", String(parseLimit(options.adminFilters.limit)));

    if (kind === "users") {
      const search = options.adminFilters.userSearch.trim();
      if (search) {
        params.set("search", search);
      }
    }

    if (kind === "activity") {
      const userId = options.adminFilters.userId.trim();
      const actionName = options.adminFilters.activityAction.trim();
      const entityType = options.adminFilters.activityEntityType.trim();
      if (userId) {
        params.set("user_id", userId);
      }
      if (actionName) {
        params.set("action", actionName);
      }
      if (entityType) {
        params.set("entity_type", entityType);
      }
    }

    if (kind === "billing-ledger") {
      const userId = options.adminFilters.userId.trim();
      const eventType = options.adminFilters.billingEventType.trim();
      if (userId) {
        params.set("user_id", userId);
      }
      if (eventType) {
        params.set("event_type", eventType);
      }
    }

    return `/admin/${kind}?${params.toString()}`;
  };

  const buildAdminReadHeaders = (): Record<string, string> => {
    const headers = options.authHeaders();
    const key = options.adminKey.trim();
    if (key) {
      return { ...headers, "x-admin-key": key };
    }
    return headers;
  };

  const onAdminRequest = async (kind: AdminActionKind) => {
    options.persistAdminKey();

    await options.run(`Admin ${kind}`, async () => {
      if (kind === "demo-reset") {
        const key = options.adminKey.trim();
        if (!key) {
          throw new Error("Demo reset requires a valid admin key.");
        }
        await apiRequest<Record<string, unknown>>(
          "/admin/demo-reset",
          { method: "POST" },
          { "x-admin-key": key },
        );
        options.setAdminResult({ kind: "demo-reset", payload: { message: "Demo reset complete." } });
        options.clearLogs();
        options.persistSession(null);
        options.clearWorkspace();
        options.resetProfileForm();
        await options.loadCatalogTree();
        options.pushLog("Database reset complete; session cleared");
        return;
      }

      if (kind === "audit-prune" || kind === "audit-prune-preview") {
        const key = options.adminKey.trim();
        if (!key) {
          throw new Error("Audit prune requires a valid admin key.");
        }
        const retentionDays = parseRetentionDays(options.adminFilters.auditPruneRetentionDays);
        const dryRun = kind === "audit-prune-preview";
        const result = await apiRequest<{ status: string; deleted: number; retention_days: number; dry_run: boolean }>(
          `/admin/audit-prune?retention_days=${retentionDays}&dry_run=${dryRun ? "true" : "false"}`,
          { method: "POST" },
          { "x-admin-key": key },
        );
        const labelPrefix = result.dry_run ? "Would remove" : "Removed";
        options.setAdminResult({
          kind: result.dry_run ? "audit-prune-preview" : "audit-prune",
          payload: {
            message: `${labelPrefix} ${result.deleted} audit events older than ${result.retention_days} days.`,
            deleted: result.deleted,
            retention_days: result.retention_days,
          },
        });
        options.pushLog(
          `${result.dry_run ? "Audit prune preview" : "Audit prune complete"}: deleted=${result.deleted}, retention_days=${result.retention_days}`
        );
        return;
      }

      if (!options.isSessionAdmin && !options.adminKey.trim()) {
        throw new Error("Admin read access requires either an admin-role session or admin key.");
      }

      const headers = buildAdminReadHeaders();

      if (kind === "summary") {
        const result = await apiRequest<AdminSummary>(`/admin/${kind}`, { method: "GET" }, headers);
        options.setAdminResult({ kind, payload: result });
        return;
      }

      if (kind === "users") {
        const result = await apiRequest<AdminUserRow[]>(buildAdminReadPath(kind), { method: "GET" }, headers);
        options.setAdminResult({ kind, payload: result });
        return;
      }

      if (kind === "activity") {
        const result = await apiRequest<AdminActivityRow[]>(buildAdminReadPath(kind), { method: "GET" }, headers);
        options.setAdminResult({ kind, payload: result });
        return;
      }

      const result = await apiRequest<AdminBillingRow[]>(buildAdminReadPath(kind), { method: "GET" }, headers);
      options.setAdminResult({ kind, payload: result });
    });
  };

  return { onAdminRequest };
}
