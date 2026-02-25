import { useState } from "react";

import {
  DEFAULT_EDIT_LINE_ITEM_FORM,
  DEFAULT_ESTIMATE_FORM,
  DEFAULT_ESTIMATE_QUICKSTART_FORM,
  DEFAULT_LINE_ITEM_FORM,
} from "./defaults";

export function useWorkspaceForms() {
  const [estimateTitle, setEstimateTitle] = useState(DEFAULT_ESTIMATE_FORM.title);
  const [estimateCustomerName, setEstimateCustomerName] = useState(DEFAULT_ESTIMATE_FORM.customerName);
  const [estimateCustomerEmail, setEstimateCustomerEmail] = useState(DEFAULT_ESTIMATE_FORM.customerEmail);
  const [estimateCustomerPhone, setEstimateCustomerPhone] = useState(DEFAULT_ESTIMATE_FORM.customerPhone);
  const [estimateJobAddress, setEstimateJobAddress] = useState(DEFAULT_ESTIMATE_FORM.jobAddress);
  const [estimateMarkupPct, setEstimateMarkupPct] = useState(DEFAULT_ESTIMATE_FORM.estimateMarkupPct);
  const [estimateTaxRatePct, setEstimateTaxRatePct] = useState(DEFAULT_ESTIMATE_FORM.taxRatePct);
  const [quickstartCatalogNodeName, setQuickstartCatalogNodeName] = useState(DEFAULT_ESTIMATE_QUICKSTART_FORM.catalogNodeName);
  const [quickstartMaxItems, setQuickstartMaxItems] = useState(DEFAULT_ESTIMATE_QUICKSTART_FORM.maxItems);

  const [lineItemName, setLineItemName] = useState(DEFAULT_LINE_ITEM_FORM.name);
  const [lineItemQty, setLineItemQty] = useState(DEFAULT_LINE_ITEM_FORM.qty);
  const [lineItemUnitPrice, setLineItemUnitPrice] = useState(DEFAULT_LINE_ITEM_FORM.unitPrice);
  const [lineItemLaborHours, setLineItemLaborHours] = useState(DEFAULT_LINE_ITEM_FORM.laborHours);
  const [lineItemMarkupPct, setLineItemMarkupPct] = useState(DEFAULT_LINE_ITEM_FORM.itemMarkupPct);
  const [lineItemDiscountValue, setLineItemDiscountValue] = useState(DEFAULT_LINE_ITEM_FORM.discountValue);
  const [lineItemDiscountIsPercent, setLineItemDiscountIsPercent] = useState(DEFAULT_LINE_ITEM_FORM.discountIsPercent);
  const [lineItemGroupName, setLineItemGroupName] = useState(DEFAULT_LINE_ITEM_FORM.groupName);

  const [editQuantity, setEditQuantity] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.qty);
  const [editUnitPrice, setEditUnitPrice] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.unitPrice);
  const [editLaborHours, setEditLaborHours] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.laborHours);
  const [editItemMarkupPct, setEditItemMarkupPct] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.itemMarkupPct);
  const [editDiscountValue, setEditDiscountValue] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.discountValue);
  const [editDiscountIsPercent, setEditDiscountIsPercent] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.discountIsPercent);
  const [editGroupName, setEditGroupName] = useState(DEFAULT_EDIT_LINE_ITEM_FORM.groupName);
  const [lineGroupName, setLineGroupName] = useState(DEFAULT_LINE_ITEM_FORM.groupName);

  const resetEstimateForm = () => {
    setEstimateTitle(DEFAULT_ESTIMATE_FORM.title);
    setEstimateCustomerName(DEFAULT_ESTIMATE_FORM.customerName);
    setEstimateCustomerEmail(DEFAULT_ESTIMATE_FORM.customerEmail);
    setEstimateCustomerPhone(DEFAULT_ESTIMATE_FORM.customerPhone);
    setEstimateJobAddress(DEFAULT_ESTIMATE_FORM.jobAddress);
    setEstimateMarkupPct(DEFAULT_ESTIMATE_FORM.estimateMarkupPct);
    setEstimateTaxRatePct(DEFAULT_ESTIMATE_FORM.taxRatePct);
    setQuickstartCatalogNodeName(DEFAULT_ESTIMATE_QUICKSTART_FORM.catalogNodeName);
    setQuickstartMaxItems(DEFAULT_ESTIMATE_QUICKSTART_FORM.maxItems);
  };

  const resetLineItemForm = () => {
    setLineItemName(DEFAULT_LINE_ITEM_FORM.name);
    setLineItemQty(DEFAULT_LINE_ITEM_FORM.qty);
    setLineItemUnitPrice(DEFAULT_LINE_ITEM_FORM.unitPrice);
    setLineItemLaborHours(DEFAULT_LINE_ITEM_FORM.laborHours);
    setLineItemMarkupPct(DEFAULT_LINE_ITEM_FORM.itemMarkupPct);
    setLineItemDiscountValue(DEFAULT_LINE_ITEM_FORM.discountValue);
    setLineItemDiscountIsPercent(DEFAULT_LINE_ITEM_FORM.discountIsPercent);
    setLineItemGroupName(DEFAULT_LINE_ITEM_FORM.groupName);
    setLineGroupName(DEFAULT_LINE_ITEM_FORM.groupName);
  };

  const resetEditLineItemForm = () => {
    setEditQuantity(DEFAULT_EDIT_LINE_ITEM_FORM.qty);
    setEditUnitPrice(DEFAULT_EDIT_LINE_ITEM_FORM.unitPrice);
    setEditLaborHours(DEFAULT_EDIT_LINE_ITEM_FORM.laborHours);
    setEditItemMarkupPct(DEFAULT_EDIT_LINE_ITEM_FORM.itemMarkupPct);
    setEditDiscountValue(DEFAULT_EDIT_LINE_ITEM_FORM.discountValue);
    setEditDiscountIsPercent(DEFAULT_EDIT_LINE_ITEM_FORM.discountIsPercent);
    setEditGroupName(DEFAULT_EDIT_LINE_ITEM_FORM.groupName);
  };

  return {
    estimateTitle,
    setEstimateTitle,
    estimateCustomerName,
    setEstimateCustomerName,
    estimateCustomerEmail,
    setEstimateCustomerEmail,
    estimateCustomerPhone,
    setEstimateCustomerPhone,
    estimateJobAddress,
    setEstimateJobAddress,
    estimateMarkupPct,
    setEstimateMarkupPct,
    estimateTaxRatePct,
    setEstimateTaxRatePct,
    quickstartCatalogNodeName,
    setQuickstartCatalogNodeName,
    quickstartMaxItems,
    setQuickstartMaxItems,
    lineItemName,
    setLineItemName,
    lineItemQty,
    setLineItemQty,
    lineItemUnitPrice,
    setLineItemUnitPrice,
    lineItemLaborHours,
    setLineItemLaborHours,
    lineItemMarkupPct,
    setLineItemMarkupPct,
    lineItemDiscountValue,
    setLineItemDiscountValue,
    lineItemDiscountIsPercent,
    setLineItemDiscountIsPercent,
    lineItemGroupName,
    setLineItemGroupName,
    editQuantity,
    setEditQuantity,
    editUnitPrice,
    setEditUnitPrice,
    editLaborHours,
    setEditLaborHours,
    editItemMarkupPct,
    setEditItemMarkupPct,
    editDiscountValue,
    setEditDiscountValue,
    editDiscountIsPercent,
    setEditDiscountIsPercent,
    editGroupName,
    setEditGroupName,
    lineGroupName,
    setLineGroupName,
    resetEstimateForm,
    resetLineItemForm,
    resetEditLineItemForm,
  };
}
