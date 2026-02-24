import { Dispatch, SetStateAction } from "react";

import { DEFAULT_ADMIN_FILTERS } from "./defaults";
import { AdminFilters } from "../types";

type SetAdminFilters = Dispatch<SetStateAction<AdminFilters>>;

export function createAdminFilterBindings(setAdminFilters: SetAdminFilters) {
  return {
    setAdminLimit: (value: string) => setAdminFilters((current) => ({ ...current, limit: value || DEFAULT_ADMIN_FILTERS.limit })),
    setAdminUserSearch: (value: string) => setAdminFilters((current) => ({ ...current, userSearch: value })),
    setAdminUserIdFilter: (value: string) => setAdminFilters((current) => ({ ...current, userId: value })),
    setAdminActivityActionFilter: (value: string) => setAdminFilters((current) => ({ ...current, activityAction: value })),
    setAdminActivityEntityTypeFilter: (value: string) =>
      setAdminFilters((current) => ({ ...current, activityEntityType: value })),
    setAdminBillingEventTypeFilter: (value: string) =>
      setAdminFilters((current) => ({ ...current, billingEventType: value })),
    setAdminAuditPruneRetentionDays: (value: string) =>
      setAdminFilters((current) => ({ ...current, auditPruneRetentionDays: value || DEFAULT_ADMIN_FILTERS.auditPruneRetentionDays })),
  };
}
