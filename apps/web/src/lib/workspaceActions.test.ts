import { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";
import { createWorkspaceActions } from "./workspaceActions";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

type WorkspaceActionOptions = Parameters<typeof createWorkspaceActions>[0];

function buildOptions(overrides: Partial<WorkspaceActionOptions> = {}): WorkspaceActionOptions {
  return {
    runWithSession: vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    }),
    runWithEstimate: vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    }),
    runWithEstimateLine: vi.fn(async (_label, _noSession, _noEstimate, _noLine, action) => {
      await action({ "x-session-token": "token-1" }, "est-1", "line-1");
    }),
    estimateTitle: "Kitchen",
    estimateCustomerName: "Demo Customer",
    estimateCustomerEmail: "demo@example.com",
    estimateCustomerPhone: "1234567890",
    estimateJobAddress: "123 Main",
    estimateMarkupPct: "10",
    estimateTaxRatePct: "8",
    quickstartCatalogNodeName: "Bathroom",
    quickstartMaxItems: "5",
    lineItemName: "Countertop",
    lineItemQty: "2",
    lineItemUnitPrice: "85.00",
    lineItemLaborHours: "1.5",
    lineItemMarkupPct: "5",
    lineItemDiscountValue: "0",
    lineItemDiscountIsPercent: false,
    lineItemGroupName: "",
    editQuantity: "3",
    editUnitPrice: "90.00",
    editLaborHours: "2",
    editItemMarkupPct: "6",
    editDiscountValue: "1",
    editDiscountIsPercent: true,
    editGroupName: "",
    lineGroupName: "Kitchen Group",
    selectedLineItemId: "line-1",
    selectedLines: [{ id: "line-1" }, { id: "line-2" }],
    defaultLineItemGroupName: "General",
    decimalOrZero: vi.fn((value: string) => value),
    refreshEstimateViews: vi.fn(async () => {}),
    pushLog: vi.fn(),
    ...overrides,
  };
}

describe("createWorkspaceActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates estimate and refreshes selection", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: "est-9" });
    const options = buildOptions();
    const actions = createWorkspaceActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onCreateEstimate(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
      "/estimates",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Kitchen",
          customer_name: "Demo Customer",
          customer_email: "demo@example.com",
          customer_phone: "1234567890",
          job_address: "123 Main",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(options.refreshEstimateViews).toHaveBeenCalledWith("est-9");
  });

  it("adds line item using default group name when blank", async () => {
    vi.mocked(apiRequest).mockResolvedValue({});
    const options = buildOptions();
    const actions = createWorkspaceActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onAddLineItem(event);

    expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
      "/estimates/est-1/line-items",
      {
        method: "POST",
        body: JSON.stringify({
          item_name: "Countertop",
          quantity: "2",
          unit_price: "85.00",
          labor_hours: "1.5",
          item_markup_pct: "5",
          discount_value: "0",
          discount_is_percent: false,
          group_name: "General",
        }),
      },
      { "x-session-token": "token-1" },
    );
  });

  it("does not call API when reorder would move out of bounds", async () => {
    vi.mocked(apiRequest).mockResolvedValue({});
    const options = buildOptions();
    const actions = createWorkspaceActions(options);

    await actions.onReorderSelectedLine(-1);

    expect(vi.mocked(apiRequest)).not.toHaveBeenCalled();
    expect(options.refreshEstimateViews).not.toHaveBeenCalled();
  });

  it("blocks grouping when group name is empty", async () => {
    const options = buildOptions({ lineGroupName: "   " });
    const actions = createWorkspaceActions(options);

    await actions.onGroupLineItems("all");

    expect(options.pushLog).toHaveBeenCalledWith("Line group blocked: select estimate and provide group name");
    expect(options.runWithEstimate).not.toHaveBeenCalled();
  });

  it("applies quick start using selected catalog room", async () => {
    vi.mocked(apiRequest).mockResolvedValue({});
    const options = buildOptions();
    const actions = createWorkspaceActions(options);

    await actions.onApplyCatalogQuickstart();

    expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
      "/estimates/est-1/quickstart",
      {
        method: "POST",
        body: JSON.stringify({
          catalog_node_name: "Bathroom",
          max_items: 5,
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(options.refreshEstimateViews).toHaveBeenCalledWith("est-1");
  });
});
