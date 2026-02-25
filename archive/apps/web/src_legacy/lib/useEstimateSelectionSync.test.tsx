import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEstimateSelectionSync } from "./useEstimateSelectionSync";

type HookOptions = Parameters<typeof useEstimateSelectionSync>[0];

function buildOptions(overrides: Partial<HookOptions> = {}): HookOptions {
  return {
    selectedEstimate: null,
    selectedLineItemId: "",
    selectedLine: null,
    defaultLineItemGroupName: "General",
    setSelectedLineItemId: vi.fn(),
    resetEditLineItemForm: vi.fn(),
    setEditQuantity: vi.fn(),
    setEditUnitPrice: vi.fn(),
    setEditLaborHours: vi.fn(),
    setEditItemMarkupPct: vi.fn(),
    setEditDiscountValue: vi.fn(),
    setEditDiscountIsPercent: vi.fn(),
    setEditGroupName: vi.fn(),
    setLineGroupName: vi.fn(),
    setEstimateTitle: vi.fn(),
    setEstimateCustomerName: vi.fn(),
    setEstimateCustomerEmail: vi.fn(),
    setEstimateCustomerPhone: vi.fn(),
    setEstimateJobAddress: vi.fn(),
    setEstimateMarkupPct: vi.fn(),
    setEstimateTaxRatePct: vi.fn(),
    ...overrides,
  };
}

describe("useEstimateSelectionSync", () => {
  it("sets default selected line id when estimate has lines", async () => {
    const options = buildOptions({
      selectedEstimate: {
        id: "est-1",
        title: "Kitchen",
        status: "draft",
        version: 1,
        customer_name: "Demo",
        customer_email: "",
        customer_phone: "",
        job_address: "",
        estimate_markup_pct: "0",
        tax_rate_pct: "0",
        subtotal: "0",
        tax: "0",
        total: "0",
        line_items: [
          {
            id: "line-1",
            estimate_id: "est-1",
            sort_order: 0,
            group_name: "",
            item_name: "Countertop",
            quantity: "1",
            unit_price: "10",
            item_markup_pct: "0",
            discount_value: "0",
            discount_is_percent: false,
            labor_hours: "0",
            labor_rate: "0",
            total_price: "10",
          },
        ],
      },
    });

    renderHook(() => useEstimateSelectionSync(options));

    await waitFor(() => expect(options.setSelectedLineItemId).toHaveBeenCalled());
  });

  it("resets edit form when selected line is missing", async () => {
    const options = buildOptions({
      selectedEstimate: {
        id: "est-1",
        title: "Kitchen",
        status: "draft",
        version: 1,
        customer_name: "Demo",
        customer_email: "",
        customer_phone: "",
        job_address: "",
        estimate_markup_pct: "0",
        tax_rate_pct: "0",
        subtotal: "0",
        tax: "0",
        total: "0",
        line_items: [],
      },
      selectedLine: null,
    });

    renderHook(() => useEstimateSelectionSync(options));

    await waitFor(() => expect(options.resetEditLineItemForm).toHaveBeenCalled());
  });
});
