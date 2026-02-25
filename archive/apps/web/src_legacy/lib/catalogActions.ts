import { FormEvent } from "react";

import { apiRequest } from "./api";
import { CatalogItem } from "../types";

type RequestHeaders = Record<string, string>;

type RunAction = (label: string, action: () => Promise<void>) => Promise<void>;

type RunWithSession = (
  label: string,
  blockedMessage: string,
  action: (headers: RequestHeaders) => Promise<void>,
) => Promise<void>;

type RunWithEstimate = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  action: (headers: RequestHeaders, estimateId: string) => Promise<void>,
) => Promise<void>;

type CreateCatalogActionsOptions = {
  run: RunAction;
  runWithSession: RunWithSession;
  runWithEstimate: RunWithEstimate;
  catalogQuery: string;
  catalogUpsertName: string;
  catalogUpsertPrice: string;
  catalogUpsertLabor: string;
  catalogUpsertDescription: string;
  catalogImportJson: string;
  lineItemName: string;
  lineItemGroupName: string;
  profileItemMarkupPct: string;
  defaultLineItemGroupName: string;
  defaultProfileItemMarkupPct: string;
  setCatalogResults: (items: CatalogItem[]) => void;
  setCatalogOpsOutput: (value: string) => void;
  loadCatalogTree: () => Promise<void>;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
  resetLineItemForm: () => void;
  setLineItemName: (value: string) => void;
  setLineItemUnitPrice: (value: string) => void;
  setLineItemQty: (value: string) => void;
  setLineItemLaborHours: (value: string) => void;
  setLineItemMarkupPct: (value: string) => void;
  setActivePanel: (panel: "workspace") => void;
  decimalOrZero: (value: string) => string;
};

export function createCatalogActions(options: CreateCatalogActionsOptions) {
  const onCatalogSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await options.run("Catalog search", async () => {
      const query = options.catalogQuery.trim();
      if (!query) {
        options.setCatalogResults([]);
        return;
      }
      const rows = await apiRequest<CatalogItem[]>(
        `/catalog/search?query=${encodeURIComponent(query)}&limit=20`,
        { method: "GET" },
      );
      options.setCatalogResults(rows);
    });
  };

  const onAddCatalogItem = async (item: CatalogItem) => {
    await options.runWithEstimate(
      "Catalog add line item",
      "Catalog add blocked: login required",
      "Catalog add blocked: select an estimate",
      async (headers, estimateId) => {
        await apiRequest(
          `/estimates/${estimateId}/line-items`,
          {
            method: "POST",
            body: JSON.stringify({
              item_name: item.name,
              quantity: "1",
              unit_price: item.unit_price,
              labor_hours: item.labor_hours,
              item_markup_pct: options.decimalOrZero(options.profileItemMarkupPct),
              discount_value: "0",
              discount_is_percent: false,
              group_name: options.lineItemGroupName.trim() || options.defaultLineItemGroupName,
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
        options.resetLineItemForm();
        options.setLineItemName(item.name);
        options.setLineItemUnitPrice(item.unit_price);
        options.setLineItemQty("1");
        options.setLineItemLaborHours(item.labor_hours);
        options.setLineItemMarkupPct(options.profileItemMarkupPct || options.defaultProfileItemMarkupPct);
        options.setActivePanel("workspace");
      },
    );
  };

  const onCatalogUpsert = async () => {
    await options.runWithSession("Catalog upsert", "Catalog upsert blocked: login required", async (headers) => {
      const payload = await apiRequest<{ item_id: string; name: string; action: string }>(
        "/catalog/upsert",
        {
          method: "POST",
          body: JSON.stringify({
            name: options.catalogUpsertName,
            unit_price: options.catalogUpsertPrice,
            labor_hours: options.catalogUpsertLabor,
            description: options.catalogUpsertDescription,
          }),
        },
        headers,
      );
      const verb = payload.action === "catalog.item.create" ? "Created" : "Updated";
      options.setCatalogOpsOutput(`${verb} catalog item "${payload.name}" (id: ${payload.item_id}).`);
      await options.loadCatalogTree();
      if (options.catalogQuery.trim()) {
        const rows = await apiRequest<CatalogItem[]>(
          `/catalog/search?query=${encodeURIComponent(options.catalogQuery.trim())}&limit=20`,
          { method: "GET" },
        );
        options.setCatalogResults(rows);
      }
      if (!options.lineItemName.trim()) {
        options.setLineItemName(options.catalogUpsertName);
      }
    });
  };

  const onCatalogImport = async () => {
    await options.runWithSession("Catalog import", "Catalog import blocked: login required", async (headers) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(options.catalogImportJson);
      } catch {
        throw new Error("Catalog import JSON is invalid.");
      }
      if (!Array.isArray(parsed)) {
        throw new Error("Catalog import JSON must be an array.");
      }
      const payload = await apiRequest<{ inserted: number; updated: number }>(
        "/catalog/import",
        {
          method: "POST",
          body: JSON.stringify({ items: parsed }),
        },
        headers,
      );
      options.setCatalogOpsOutput(`Catalog import finished. Inserted: ${payload.inserted}. Updated: ${payload.updated}.`);
      await options.loadCatalogTree();
    });
  };

  return {
    onCatalogSearch,
    onAddCatalogItem,
    onCatalogUpsert,
    onCatalogImport,
  };
}
