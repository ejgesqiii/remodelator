import { useState } from "react";

import { DEFAULT_ADMIN_FILTERS } from "./defaults";
import { ActivePanel, AdminFilters, AdminResult, BillingEvent, Estimate } from "../types";

export function useWorkspaceCoreState() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [selectedLineItemId, setSelectedLineItemId] = useState("");
  const [billingLedger, setBillingLedger] = useState<BillingEvent[]>([]);
  const [adminResult, setAdminResult] = useState<AdminResult>({ kind: "none" });
  const [adminFilters, setAdminFilters] = useState<AdminFilters>(DEFAULT_ADMIN_FILTERS);
  const [activePanel, setActivePanel] = useState<ActivePanel>("session");

  return {
    estimates,
    setEstimates,
    selectedEstimateId,
    setSelectedEstimateId,
    selectedEstimate,
    setSelectedEstimate,
    selectedLineItemId,
    setSelectedLineItemId,
    billingLedger,
    setBillingLedger,
    adminResult,
    setAdminResult,
    adminFilters,
    setAdminFilters,
    activePanel,
    setActivePanel,
  };
}
