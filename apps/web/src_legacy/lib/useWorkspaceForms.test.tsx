import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWorkspaceForms } from "./useWorkspaceForms";

describe("useWorkspaceForms", () => {
  it("resets estimate form values to defaults", () => {
    const { result } = renderHook(() => useWorkspaceForms());

    act(() => {
      result.current.setEstimateTitle("Custom");
      result.current.setEstimateCustomerName("Changed");
      result.current.setQuickstartCatalogNodeName("Kitchen");
      result.current.setQuickstartMaxItems("12");
    });
    act(() => {
      result.current.resetEstimateForm();
    });

    expect(result.current.estimateTitle).toBe("Kitchen Refresh");
    expect(result.current.estimateCustomerName).toBe("Demo Customer");
    expect(result.current.quickstartCatalogNodeName).toBe("Bathroom");
    expect(result.current.quickstartMaxItems).toBe("5");
  });

  it("resets line item and edit forms to defaults", () => {
    const { result } = renderHook(() => useWorkspaceForms());

    act(() => {
      result.current.setLineItemName("Custom Item");
      result.current.setLineGroupName("Custom Group");
      result.current.setEditQuantity("99");
    });
    act(() => {
      result.current.resetLineItemForm();
      result.current.resetEditLineItemForm();
    });

    expect(result.current.lineItemName).toBe("Countertop Install");
    expect(result.current.lineGroupName).toBe("General");
    expect(result.current.editQuantity).toBe("");
  });
});
