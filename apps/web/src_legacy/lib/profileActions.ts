import { apiRequest } from "./api";
import { BackupPayload, RestoreBackupResult, UserProfile } from "../types";

type RequestHeaders = Record<string, string>;

type RunWithSession = (
  label: string,
  blockedMessage: string,
  action: (headers: RequestHeaders) => Promise<void>,
) => Promise<void>;

type CreateProfileActionsOptions = {
  runWithSession: RunWithSession;
  profileFullName: string;
  profileLaborRate: string;
  profileItemMarkupPct: string;
  profileEstimateMarkupPct: string;
  profileTaxRatePct: string;
  decimalOrZero: (value: string) => string;
  setProfileFullName: (value: string) => void;
  setProfileRole: (value: string) => void;
  setProfileLaborRate: (value: string) => void;
  setProfileItemMarkupPct: (value: string) => void;
  setProfileEstimateMarkupPct: (value: string) => void;
  setProfileTaxRatePct: (value: string) => void;
  setProfileStatus: (value: string) => void;
  loadProfile: () => Promise<void>;
  loadActivityAndAudit: () => Promise<void>;
  setLastSnapshot: (value: BackupPayload | null) => void;
  setSnapshotStatus: (value: string) => void;
  lastSnapshot: BackupPayload | null;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
  selectedEstimateId: string | null;
  pushLog: (line: string) => void;
};

export function createProfileActions(options: CreateProfileActionsOptions) {
  const onLoadProfile = async () => {
    await options.runWithSession("Load profile", "Profile load blocked: login required", async () => {
      await options.loadProfile();
    });
  };

  const onSaveProfile = async () => {
    await options.runWithSession("Save profile", "Profile update blocked: login required", async (headers) => {
      const updated = await apiRequest<UserProfile>(
        "/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            full_name: options.profileFullName,
            labor_rate: options.decimalOrZero(options.profileLaborRate),
            item_markup_pct: options.decimalOrZero(options.profileItemMarkupPct),
            estimate_markup_pct: options.decimalOrZero(options.profileEstimateMarkupPct),
            tax_rate_pct: options.decimalOrZero(options.profileTaxRatePct),
          }),
        },
        headers,
      );
      options.setProfileFullName(updated.full_name ?? "");
      options.setProfileRole(updated.role ?? "user");
      options.setProfileLaborRate(updated.labor_rate);
      options.setProfileItemMarkupPct(updated.default_item_markup_pct);
      options.setProfileEstimateMarkupPct(updated.default_estimate_markup_pct);
      options.setProfileTaxRatePct(updated.tax_rate_pct);
      options.setProfileStatus("Profile defaults saved.");
    });
  };

  const onRefreshActivity = async () => {
    await options.runWithSession("Refresh activity", "Activity refresh blocked: login required", async () => {
      await options.loadActivityAndAudit();
    });
  };

  const onExportSnapshot = async () => {
    await options.runWithSession("Export snapshot", "Snapshot export blocked: login required", async (headers) => {
      const payload = await apiRequest<BackupPayload>("/backup/export", { method: "GET" }, headers);
      options.setLastSnapshot(payload);
      const lineItemCount = payload.estimates.reduce((total, estimate) => total + (estimate.line_items?.length ?? 0), 0);
      options.setSnapshotStatus(`Snapshot exported (${payload.estimates.length} estimates, ${lineItemCount} line items).`);

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `remodelator_snapshot_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });
  };

  const onRestoreSnapshot = async () => {
    if (!options.lastSnapshot) {
      options.pushLog("Snapshot restore blocked: export snapshot first");
      return;
    }
    await options.runWithSession("Restore snapshot", "Snapshot restore blocked: login required", async (headers) => {
      const result = await apiRequest<RestoreBackupResult>(
        "/backup/restore",
        {
          method: "POST",
          body: JSON.stringify({ payload: options.lastSnapshot }),
        },
        headers,
      );
      options.setSnapshotStatus(`Snapshot restored (${result.estimates_restored} estimates, ${result.line_items_restored} line items).`);
      await Promise.all([options.refreshEstimateViews(options.selectedEstimateId), options.loadActivityAndAudit()]);
    });
  };

  return {
    onLoadProfile,
    onSaveProfile,
    onRefreshActivity,
    onExportSnapshot,
    onRestoreSnapshot,
  };
}
