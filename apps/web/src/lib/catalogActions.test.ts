import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormEvent } from "react";

import { apiRequest } from "./api";
import { createCatalogActions } from "./catalogActions";
import { CatalogItem } from "../types";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

type CatalogActionOptions = Parameters<typeof createCatalogActions>[0];

function buildOptions(overrides: Partial<CatalogActionOptions> = {}): CatalogActionOptions {
  return {
    run: vi.fn(async (_label, action) => {
      await action();
    }),
    runWithSession: vi.fn(async (_label, _noSession, action) => {
      await action({ "x-session-token": "token-1" });
    }),
    runWithEstimate: vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-1");
    }),
    catalogQuery: "counter",
    catalogUpsertName: "Countertop Install",
    catalogUpsertPrice: "100.00",
    catalogUpsertLabor: "2.50",
    catalogUpsertDescription: "Quartz install",
    catalogImportJson: '[{"name":"Demo","unit_price":"10","labor_hours":"1"}]',
    lineItemName: "",
    lineItemGroupName: "",
    profileItemMarkupPct: "8.0",
    defaultLineItemGroupName: "General",
    defaultProfileItemMarkupPct: "0",
    setCatalogResults: vi.fn(),
    setCatalogOpsOutput: vi.fn(),
    loadCatalogTree: vi.fn(async () => {}),
    refreshEstimateViews: vi.fn(async () => {}),
    resetLineItemForm: vi.fn(),
    setLineItemName: vi.fn(),
    setLineItemUnitPrice: vi.fn(),
    setLineItemQty: vi.fn(),
    setLineItemLaborHours: vi.fn(),
    setLineItemMarkupPct: vi.fn(),
    setActivePanel: vi.fn(),
    decimalOrZero: vi.fn((value: string) => value),
    ...overrides,
  };
}

describe("createCatalogActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches catalog for query text", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    const rows: CatalogItem[] = [{ id: "cat-1", name: "Countertop", unit_price: "85.00", labor_hours: "2.00" }];
    mockedApiRequest.mockResolvedValue(rows);

    const options = buildOptions();
    const actions = createCatalogActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onCatalogSearch(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockedApiRequest).toHaveBeenCalledWith("/catalog/search?query=counter&limit=20", { method: "GET" });
    expect(options.setCatalogResults).toHaveBeenCalledWith(rows);
  });

  it("clears catalog results when query is empty", async () => {
    const options = buildOptions({ catalogQuery: "   " });
    const actions = createCatalogActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onCatalogSearch(event);

    expect(options.setCatalogResults).toHaveBeenCalledWith([]);
    expect(vi.mocked(apiRequest)).not.toHaveBeenCalled();
  });

  it("adds a catalog item as a line item and updates workspace state", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({});

    const options = buildOptions();
    const actions = createCatalogActions(options);
    const item: CatalogItem = { id: "cat-9", name: "Countertop Install", unit_price: "95.00", labor_hours: "3.00" };

    await actions.onAddCatalogItem(item);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/estimates/est-1/line-items",
      {
        method: "POST",
        body: JSON.stringify({
          item_name: "Countertop Install",
          quantity: "1",
          unit_price: "95.00",
          labor_hours: "3.00",
          item_markup_pct: "8.0",
          discount_value: "0",
          discount_is_percent: false,
          group_name: "General",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(options.refreshEstimateViews).toHaveBeenCalledWith("est-1");
    expect(options.resetLineItemForm).toHaveBeenCalled();
    expect(options.setLineItemName).toHaveBeenCalledWith("Countertop Install");
    expect(options.setLineItemUnitPrice).toHaveBeenCalledWith("95.00");
    expect(options.setLineItemQty).toHaveBeenCalledWith("1");
    expect(options.setLineItemLaborHours).toHaveBeenCalledWith("3.00");
    expect(options.setLineItemMarkupPct).toHaveBeenCalledWith("8.0");
    expect(options.setActivePanel).toHaveBeenCalledWith("workspace");
  });

  it("upserts catalog item and refreshes tree and search results", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest
      .mockResolvedValueOnce({ item_id: "cat-11", name: "Countertop Install", action: "catalog.item.create" })
      .mockResolvedValueOnce([{ id: "cat-11", name: "Countertop Install", unit_price: "100.00", labor_hours: "2.50" }]);

    const options = buildOptions();
    const actions = createCatalogActions(options);

    await actions.onCatalogUpsert();

    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      1,
      "/catalog/upsert",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Countertop Install",
          unit_price: "100.00",
          labor_hours: "2.50",
          description: "Quartz install",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(options.setCatalogOpsOutput).toHaveBeenCalledWith('Created catalog item "Countertop Install" (id: cat-11).');
    expect(options.loadCatalogTree).toHaveBeenCalled();
    expect(options.setCatalogResults).toHaveBeenCalledWith([
      { id: "cat-11", name: "Countertop Install", unit_price: "100.00", labor_hours: "2.50" },
    ]);
    expect(options.setLineItemName).toHaveBeenCalledWith("Countertop Install");
  });

  it("rejects invalid JSON on catalog import", async () => {
    const options = buildOptions({ catalogImportJson: "{bad json}" });
    const actions = createCatalogActions(options);

    await expect(actions.onCatalogImport()).rejects.toThrow("Catalog import JSON is invalid.");
    expect(vi.mocked(apiRequest)).not.toHaveBeenCalled();
  });
});
