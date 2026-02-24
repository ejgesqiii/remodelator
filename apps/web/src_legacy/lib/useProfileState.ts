import { useState } from "react";

import { DEFAULT_PROFILE_FORM, DEFAULT_PROFILE_ROLE, DEFAULT_PROFILE_STATUS, DEFAULT_SNAPSHOT_STATUS } from "./defaults";
import { ActivitySummary, AuditEntry, BackupPayload } from "../types";

export function useProfileState() {
  const [profileFullName, setProfileFullName] = useState(DEFAULT_PROFILE_FORM.fullName);
  const [profileRole, setProfileRole] = useState(DEFAULT_PROFILE_ROLE);
  const [profileLaborRate, setProfileLaborRate] = useState(DEFAULT_PROFILE_FORM.laborRate);
  const [profileItemMarkupPct, setProfileItemMarkupPct] = useState(DEFAULT_PROFILE_FORM.itemMarkupPct);
  const [profileEstimateMarkupPct, setProfileEstimateMarkupPct] = useState(DEFAULT_PROFILE_FORM.estimateMarkupPct);
  const [profileTaxRatePct, setProfileTaxRatePct] = useState(DEFAULT_PROFILE_FORM.taxRatePct);
  const [profileStatus, setProfileStatus] = useState(DEFAULT_PROFILE_STATUS);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [snapshotStatus, setSnapshotStatus] = useState(DEFAULT_SNAPSHOT_STATUS);
  const [lastSnapshot, setLastSnapshot] = useState<BackupPayload | null>(null);

  const resetProfileForm = () => {
    setProfileFullName(DEFAULT_PROFILE_FORM.fullName);
    setProfileRole(DEFAULT_PROFILE_ROLE);
    setProfileLaborRate(DEFAULT_PROFILE_FORM.laborRate);
    setProfileItemMarkupPct(DEFAULT_PROFILE_FORM.itemMarkupPct);
    setProfileEstimateMarkupPct(DEFAULT_PROFILE_FORM.estimateMarkupPct);
    setProfileTaxRatePct(DEFAULT_PROFILE_FORM.taxRatePct);
    setProfileStatus(DEFAULT_PROFILE_STATUS);
  };

  return {
    profileFullName,
    setProfileFullName,
    profileRole,
    setProfileRole,
    profileLaborRate,
    setProfileLaborRate,
    profileItemMarkupPct,
    setProfileItemMarkupPct,
    profileEstimateMarkupPct,
    setProfileEstimateMarkupPct,
    profileTaxRatePct,
    setProfileTaxRatePct,
    profileStatus,
    setProfileStatus,
    activitySummary,
    setActivitySummary,
    auditTrail,
    setAuditTrail,
    snapshotStatus,
    setSnapshotStatus,
    lastSnapshot,
    setLastSnapshot,
    resetProfileForm,
  };
}
