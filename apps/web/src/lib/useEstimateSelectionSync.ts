import { useEffect } from "react";

import { Estimate, LineItem } from "../types";

type UseEstimateSelectionSyncOptions = {
  selectedEstimate: Estimate | null;
  selectedLineItemId: string;
  selectedLine: LineItem | null;
  defaultLineItemGroupName: string;
  setSelectedLineItemId: (value: string | ((current: string) => string)) => void;
  resetEditLineItemForm: () => void;
  setEditQuantity: (value: string) => void;
  setEditUnitPrice: (value: string) => void;
  setEditLaborHours: (value: string) => void;
  setEditItemMarkupPct: (value: string) => void;
  setEditDiscountValue: (value: string) => void;
  setEditDiscountIsPercent: (value: boolean) => void;
  setEditGroupName: (value: string) => void;
  setLineGroupName: (value: string) => void;
  setEstimateTitle: (value: string) => void;
  setEstimateCustomerName: (value: string) => void;
  setEstimateCustomerEmail: (value: string) => void;
  setEstimateCustomerPhone: (value: string) => void;
  setEstimateJobAddress: (value: string) => void;
  setEstimateMarkupPct: (value: string) => void;
  setEstimateTaxRatePct: (value: string) => void;
};

export function useEstimateSelectionSync(options: UseEstimateSelectionSyncOptions): void {
  useEffect(() => {
    const lines = options.selectedEstimate?.line_items ?? [];
    if (!lines.length) {
      options.setSelectedLineItemId("");
      return;
    }
    options.setSelectedLineItemId((current) =>
      current && lines.some((line) => line.id === current) ? current : lines[0].id,
    );
  }, [options.selectedEstimate?.id, options.selectedEstimate?.updated_at, options.selectedEstimate?.line_items?.length]);

  useEffect(() => {
    if (!options.selectedLine) {
      options.resetEditLineItemForm();
      return;
    }
    options.setEditQuantity(options.selectedLine.quantity);
    options.setEditUnitPrice(options.selectedLine.unit_price);
    options.setEditLaborHours(options.selectedLine.labor_hours);
    options.setEditItemMarkupPct(options.selectedLine.item_markup_pct);
    options.setEditDiscountValue(options.selectedLine.discount_value);
    options.setEditDiscountIsPercent(Boolean(options.selectedLine.discount_is_percent));
    options.setEditGroupName(options.selectedLine.group_name || options.defaultLineItemGroupName);
    options.setLineGroupName(options.selectedLine.group_name || options.defaultLineItemGroupName);
  }, [options.selectedLineItemId, options.selectedEstimate?.id, options.selectedEstimate?.updated_at]);

  useEffect(() => {
    if (!options.selectedEstimate) {
      return;
    }
    options.setEstimateTitle(options.selectedEstimate.title);
    options.setEstimateCustomerName(options.selectedEstimate.customer_name ?? "");
    options.setEstimateCustomerEmail(options.selectedEstimate.customer_email ?? "");
    options.setEstimateCustomerPhone(options.selectedEstimate.customer_phone ?? "");
    options.setEstimateJobAddress(options.selectedEstimate.job_address ?? "");
    options.setEstimateMarkupPct(options.selectedEstimate.estimate_markup_pct ?? "0");
    options.setEstimateTaxRatePct(options.selectedEstimate.tax_rate_pct ?? "0");
  }, [options.selectedEstimate?.id, options.selectedEstimate?.updated_at]);
}
