import { FormEvent } from "react";

import { apiRequest } from "./api";
import { GroupScope, ReorderDirection } from "../types";

type RequestHeaders = Record<string, string>;

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

type RunWithEstimateLine = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  noLineMessage: string,
  action: (headers: RequestHeaders, estimateId: string, lineItemId: string) => Promise<void>,
) => Promise<void>;

type CreateWorkspaceActionsOptions = {
  runWithSession: RunWithSession;
  runWithEstimate: RunWithEstimate;
  runWithEstimateLine: RunWithEstimateLine;
  estimateTitle: string;
  estimateCustomerName: string;
  estimateCustomerEmail: string;
  estimateCustomerPhone: string;
  estimateJobAddress: string;
  estimateMarkupPct: string;
  estimateTaxRatePct: string;
  quickstartCatalogNodeName: string;
  quickstartMaxItems: string;
  lineItemName: string;
  lineItemQty: string;
  lineItemUnitPrice: string;
  lineItemLaborHours: string;
  lineItemMarkupPct: string;
  lineItemDiscountValue: string;
  lineItemDiscountIsPercent: boolean;
  lineItemGroupName: string;
  editQuantity: string;
  editUnitPrice: string;
  editLaborHours: string;
  editItemMarkupPct: string;
  editDiscountValue: string;
  editDiscountIsPercent: boolean;
  editGroupName: string;
  lineGroupName: string;
  selectedLineItemId: string;
  selectedLines: Array<{ id: string }>;
  defaultLineItemGroupName: string;
  decimalOrZero: (value: string) => string;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
  pushLog: (line: string) => void;
};

export function createWorkspaceActions(options: CreateWorkspaceActionsOptions) {
  const onCreateEstimate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await options.runWithSession("Create estimate", "Create estimate blocked: login required", async (headers) => {
      const est = await apiRequest<{ id: string }>(
        "/estimates",
        {
          method: "POST",
          body: JSON.stringify({
            title: options.estimateTitle,
            customer_name: options.estimateCustomerName,
            customer_email: options.estimateCustomerEmail,
            customer_phone: options.estimateCustomerPhone,
            job_address: options.estimateJobAddress,
          }),
        },
        headers,
      );
      await options.refreshEstimateViews(est.id);
    });
  };

  const onAddLineItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await options.runWithEstimate(
      "Add line item",
      "Add line item blocked: login required",
      "Add line item blocked: select an estimate",
      async (headers, estimateId) => {
        await apiRequest(
          `/estimates/${estimateId}/line-items`,
          {
            method: "POST",
            body: JSON.stringify({
              item_name: options.lineItemName,
              quantity: options.decimalOrZero(options.lineItemQty),
              unit_price: options.decimalOrZero(options.lineItemUnitPrice),
              labor_hours: options.decimalOrZero(options.lineItemLaborHours),
              item_markup_pct: options.decimalOrZero(options.lineItemMarkupPct),
              discount_value: options.decimalOrZero(options.lineItemDiscountValue),
              discount_is_percent: options.lineItemDiscountIsPercent,
              group_name: options.lineItemGroupName.trim() || options.defaultLineItemGroupName,
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onUpdateEstimateDetails = async () => {
    await options.runWithEstimate(
      "Update estimate details",
      "Estimate details update blocked: login required",
      "Estimate details update blocked: select an estimate",
      async (headers, estimateId) => {
        await apiRequest(
          `/estimates/${estimateId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: options.estimateTitle,
              customer_name: options.estimateCustomerName,
              customer_email: options.estimateCustomerEmail,
              customer_phone: options.estimateCustomerPhone,
              job_address: options.estimateJobAddress,
              estimate_markup_pct: options.decimalOrZero(options.estimateMarkupPct),
              tax_rate_pct: options.decimalOrZero(options.estimateTaxRatePct),
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onApplyCatalogQuickstart = async () => {
    const catalogNodeName = options.quickstartCatalogNodeName.trim();
    if (!catalogNodeName) {
      options.pushLog("Quick start blocked: provide a catalog room");
      return;
    }
    const parsedMaxItems = Number.parseInt(options.quickstartMaxItems, 10);
    const maxItems = Number.isFinite(parsedMaxItems) ? Math.max(1, Math.min(parsedMaxItems, 50)) : 5;
    await options.runWithEstimate(
      "Estimate quick start",
      "Quick start blocked: login required",
      "Quick start blocked: select an estimate",
      async (headers, estimateId) => {
        await apiRequest(
          `/estimates/${estimateId}/quickstart`,
          {
            method: "POST",
            body: JSON.stringify({
              catalog_node_name: catalogNodeName,
              max_items: maxItems,
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onUpdateSelectedLine = async () => {
    await options.runWithEstimateLine(
      "Update selected line",
      "Line update blocked: login required",
      "Line update blocked: select estimate",
      "Line update blocked: select line item",
      async (headers, estimateId, lineItemId) => {
        await apiRequest(
          `/estimates/${estimateId}/line-items/${lineItemId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              quantity: options.decimalOrZero(options.editQuantity),
              unit_price: options.decimalOrZero(options.editUnitPrice),
              labor_hours: options.decimalOrZero(options.editLaborHours),
              item_markup_pct: options.decimalOrZero(options.editItemMarkupPct),
              discount_value: options.decimalOrZero(options.editDiscountValue),
              discount_is_percent: options.editDiscountIsPercent,
              group_name: options.editGroupName.trim() || options.defaultLineItemGroupName,
            }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onRemoveSelectedLine = async () => {
    await options.runWithEstimateLine(
      "Remove selected line",
      "Line remove blocked: login required",
      "Line remove blocked: select estimate",
      "Line remove blocked: select line item",
      async (headers, estimateId, lineItemId) => {
        await apiRequest(`/estimates/${estimateId}/line-items/${lineItemId}`, { method: "DELETE" }, headers);
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onReorderSelectedLine = async (direction: ReorderDirection) => {
    await options.runWithEstimateLine(
      "Reorder selected line",
      "Line reorder blocked: login required",
      "Line reorder blocked: select estimate",
      "Line reorder blocked: select line item",
      async (headers, estimateId, lineItemId) => {
        const idx = options.selectedLines.findIndex((line) => line.id === lineItemId);
        if (idx < 0) {
          return;
        }
        const newIndex = idx + direction;
        if (newIndex < 0 || newIndex >= options.selectedLines.length) {
          return;
        }
        await apiRequest(
          `/estimates/${estimateId}/line-items/${lineItemId}/reorder`,
          {
            method: "POST",
            body: JSON.stringify({ new_index: newIndex }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  const onGroupLineItems = async (scope: GroupScope) => {
    if (!options.lineGroupName.trim()) {
      options.pushLog("Line group blocked: select estimate and provide group name");
      return;
    }
    await options.runWithEstimate(
      `Group line items (${scope})`,
      "Line group blocked: login required",
      "Line group blocked: select estimate and provide group name",
      async (headers, estimateId) => {
        const payload: Record<string, string> = { group_name: options.lineGroupName.trim() };
        if (scope === "selected" && options.selectedLineItemId) {
          payload.line_item_id = options.selectedLineItemId;
        }
        await apiRequest(
          `/estimates/${estimateId}/line-items/group`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
      },
    );
  };

  return {
    onCreateEstimate,
    onAddLineItem,
    onUpdateEstimateDetails,
    onApplyCatalogQuickstart,
    onUpdateSelectedLine,
    onRemoveSelectedLine,
    onReorderSelectedLine,
    onGroupLineItems,
  };
}
