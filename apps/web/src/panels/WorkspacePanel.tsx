import { FormEvent } from "react";
import { Estimate, EstimateAction, GroupScope, LineItem, LlmSuggestion, ReorderDirection } from "../types";
import { EstimateLifecycleActions } from "./workspace/EstimateLifecycleActions";
import { LineItemActions } from "./workspace/LineItemActions";
import { LlmPricingAssist } from "./workspace/LlmPricingAssist";

export type WorkspacePanelProps = {
  busy: boolean;
  isSessionReady: boolean;
  estimates: Estimate[];
  selectedEstimateId: string | null;
  selectedEstimate: Estimate | null;
  selectedLines: LineItem[];
  selectedLineItemId: string;
  setSelectedLineItemId: (lineItemId: string) => void;

  estimateTitle: string;
  setEstimateTitle: (value: string) => void;
  estimateCustomerName: string;
  setEstimateCustomerName: (value: string) => void;
  estimateCustomerEmail: string;
  setEstimateCustomerEmail: (value: string) => void;
  estimateCustomerPhone: string;
  setEstimateCustomerPhone: (value: string) => void;
  estimateJobAddress: string;
  setEstimateJobAddress: (value: string) => void;
  estimateMarkupPct: string;
  setEstimateMarkupPct: (value: string) => void;
  estimateTaxRatePct: string;
  setEstimateTaxRatePct: (value: string) => void;
  quickstartCatalogNodeName: string;
  setQuickstartCatalogNodeName: (value: string) => void;
  quickstartMaxItems: string;
  setQuickstartMaxItems: (value: string) => void;
  quickstartCatalogNodes: string[];
  quickstartCatalogReady: boolean;
  onCreateEstimate: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onSelectEstimate: (estimateId: string) => void;
  onUpdateEstimateDetails: () => void;
  onApplyCatalogQuickstart: () => void;

  lineItemName: string;
  setLineItemName: (value: string) => void;
  lineItemQty: string;
  setLineItemQty: (value: string) => void;
  lineItemUnitPrice: string;
  setLineItemUnitPrice: (value: string) => void;
  lineItemLaborHours: string;
  setLineItemLaborHours: (value: string) => void;
  lineItemMarkupPct: string;
  setLineItemMarkupPct: (value: string) => void;
  lineItemDiscountValue: string;
  setLineItemDiscountValue: (value: string) => void;
  lineItemDiscountIsPercent: boolean;
  setLineItemDiscountIsPercent: (value: boolean) => void;
  lineItemGroupName: string;
  setLineItemGroupName: (value: string) => void;
  onAddLineItem: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;

  editQuantity: string;
  setEditQuantity: (value: string) => void;
  editUnitPrice: string;
  setEditUnitPrice: (value: string) => void;
  editLaborHours: string;
  setEditLaborHours: (value: string) => void;
  editItemMarkupPct: string;
  setEditItemMarkupPct: (value: string) => void;
  editDiscountValue: string;
  setEditDiscountValue: (value: string) => void;
  editDiscountIsPercent: boolean;
  setEditDiscountIsPercent: (value: boolean) => void;
  editGroupName: string;
  setEditGroupName: (value: string) => void;
  onUpdateSelectedLine: () => void;
  onRemoveSelectedLine: () => void;
  onReorderSelectedLine: (direction: ReorderDirection) => void;

  lineGroupName: string;
  setLineGroupName: (value: string) => void;
  onGroupLineItems: (scope: GroupScope) => void;

  llmStatus: string;
  llmReadyForLive: boolean;
  llmBlockerReason: string;
  onRefreshLlmStatus: () => void;
  llmContext: string;
  setLlmContext: (value: string) => void;
  llmSuggestedPrice: string;
  setLlmSuggestedPrice: (value: string) => void;
  llmSuggestion: LlmSuggestion | null;
  onSuggestLlm: () => void;
  onApplyLlmSuggestion: () => void;

  statusTarget: string;
  setStatusTarget: (value: string) => void;
  onEstimateAction: (action: EstimateAction) => void;
};

export function WorkspacePanel(props: WorkspacePanelProps) {
  return (
    <section className="card">
      <h2>Estimate Workspace</h2>
      <p className="section-note">Build estimates, adjust line items, and lock pricing behavior.</p>
      <div className="two-col">
        <div className="stack">
          <form onSubmit={props.onCreateEstimate} className="stack">
            <h3>Create Estimate</h3>
            <input value={props.estimateTitle} onChange={(e) => props.setEstimateTitle(e.target.value)} placeholder="Title" required />
            <input
              value={props.estimateCustomerName}
              onChange={(e) => props.setEstimateCustomerName(e.target.value)}
              placeholder="Customer name"
            />
            <button disabled={props.busy || !props.isSessionReady}>Create</button>
          </form>
          <h3>Estimate List</h3>
          <ul className="list">
            {props.estimates.map((estimate) => (
              <li key={estimate.id}>
                <button
                  className={estimate.id === props.selectedEstimateId ? "selected" : ""}
                  onClick={() => props.onSelectEstimate(estimate.id)}
                  disabled={props.busy}
                >
                  <span>{estimate.title}</span>
                  <small>{`$${estimate.total}`}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="stack">
          <h3>Selected Estimate</h3>
          {!props.selectedEstimate && <div className="empty-state">Select an estimate to begin editing.</div>}
          {props.selectedEstimate && (
            <>
              <div className="stat-grid">
                <div className="stat-cell">
                  <span>Status</span>
                  <strong>{props.selectedEstimate.status}</strong>
                </div>
                <div className="stat-cell">
                  <span>Version</span>
                  <strong>{props.selectedEstimate.version}</strong>
                </div>
                <div className="stat-cell">
                  <span>Subtotal</span>
                  <strong>{`$${props.selectedEstimate.subtotal}`}</strong>
                </div>
                <div className="stat-cell">
                  <span>Total</span>
                  <strong>{`$${props.selectedEstimate.total}`}</strong>
                </div>
              </div>

              <details>
                <summary>Estimate Details</summary>
                <div className="stack detail-body">
                  <div className="inline-grid">
                    <input
                      value={props.estimateCustomerName}
                      onChange={(e) => props.setEstimateCustomerName(e.target.value)}
                      placeholder="Customer name"
                    />
                    <input
                      value={props.estimateCustomerEmail}
                      onChange={(e) => props.setEstimateCustomerEmail(e.target.value)}
                      placeholder="Customer email"
                    />
                  </div>
                  <div className="inline-grid">
                    <input
                      value={props.estimateCustomerPhone}
                      onChange={(e) => props.setEstimateCustomerPhone(e.target.value)}
                      placeholder="Customer phone"
                    />
                    <input
                      value={props.estimateJobAddress}
                      onChange={(e) => props.setEstimateJobAddress(e.target.value)}
                      placeholder="Job address"
                    />
                  </div>
                  <div className="inline-grid">
                    <input
                      value={props.estimateMarkupPct}
                      onChange={(e) => props.setEstimateMarkupPct(e.target.value)}
                      placeholder="Estimate markup %"
                    />
                    <input
                      value={props.estimateTaxRatePct}
                      onChange={(e) => props.setEstimateTaxRatePct(e.target.value)}
                      placeholder="Tax rate %"
                    />
                  </div>
                  <div className="toolbar">
                    <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={props.onUpdateEstimateDetails}>
                      Save Estimate Details
                    </button>
                  </div>
                </div>
              </details>

              <details>
                <summary>Quick Start from Catalog</summary>
                <div className="stack detail-body">
                  <p className="section-note">Add starter line items from a room category in one action.</p>
                  {!props.quickstartCatalogReady && (
                    <p className="section-note">Catalog quick-start is unavailable until at least one catalog room has starter items.</p>
                  )}
                  <div className="inline-grid">
                    <select value={props.quickstartCatalogNodeName} onChange={(e) => props.setQuickstartCatalogNodeName(e.target.value)}>
                      {props.quickstartCatalogNodes.map((node) => (
                        <option key={node} value={node}>
                          {node}
                        </option>
                      ))}
                    </select>
                    <input
                      value={props.quickstartMaxItems}
                      onChange={(e) => props.setQuickstartMaxItems(e.target.value)}
                      placeholder="Max items (1-50)"
                    />
                  </div>
                  <div className="toolbar">
                    <button
                      type="button"
                      disabled={props.busy || !props.selectedEstimateId || !props.quickstartCatalogReady}
                      onClick={props.onApplyCatalogQuickstart}
                    >
                      Add Starter Items
                    </button>
                  </div>
                </div>
              </details>
            </>
          )}

          <form onSubmit={props.onAddLineItem} className="stack">
            <h3>Add Line Item</h3>
            <input value={props.lineItemName} onChange={(e) => props.setLineItemName(e.target.value)} placeholder="Line item" required />
            <div className="inline-grid">
              <input value={props.lineItemQty} onChange={(e) => props.setLineItemQty(e.target.value)} placeholder="Qty" required />
              <input value={props.lineItemUnitPrice} onChange={(e) => props.setLineItemUnitPrice(e.target.value)} placeholder="Unit price" required />
            </div>
            <div className="inline-grid">
              <input
                value={props.lineItemLaborHours}
                onChange={(e) => props.setLineItemLaborHours(e.target.value)}
                placeholder="Labor hours"
              />
              <input
                value={props.lineItemMarkupPct}
                onChange={(e) => props.setLineItemMarkupPct(e.target.value)}
                placeholder="Item markup %"
              />
            </div>
            <div className="inline-grid">
              <input
                value={props.lineItemDiscountValue}
                onChange={(e) => props.setLineItemDiscountValue(e.target.value)}
                placeholder="Discount value"
              />
              <input
                value={props.lineItemGroupName}
                onChange={(e) => props.setLineItemGroupName(e.target.value)}
                placeholder="Group"
              />
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={props.lineItemDiscountIsPercent}
                onChange={(e) => props.setLineItemDiscountIsPercent(e.target.checked)}
              />
              Discount is percent
            </label>
            <button disabled={props.busy || !props.selectedEstimateId}>Add Line Item</button>
          </form>

          <h3>Line Items</h3>
          <ul className="list">
            {props.selectedLines.map((line) => (
              <li key={line.id}>
                <button
                  className={line.id === props.selectedLineItemId ? "selected" : ""}
                  onClick={() => props.setSelectedLineItemId(line.id)}
                  disabled={props.busy}
                >
                  <span>{`${line.item_name} (${line.quantity} x $${line.unit_price})`}</span>
                  <small>{line.group_name}</small>
                </button>
              </li>
            ))}
          </ul>

          <details>
            <summary>Line Item Actions</summary>
            <LineItemActions
              busy={props.busy}
              selectedEstimateId={props.selectedEstimateId}
              selectedLineItemId={props.selectedLineItemId}
              editQuantity={props.editQuantity}
              setEditQuantity={props.setEditQuantity}
              editUnitPrice={props.editUnitPrice}
              setEditUnitPrice={props.setEditUnitPrice}
              editLaborHours={props.editLaborHours}
              setEditLaborHours={props.setEditLaborHours}
              editItemMarkupPct={props.editItemMarkupPct}
              setEditItemMarkupPct={props.setEditItemMarkupPct}
              editDiscountValue={props.editDiscountValue}
              setEditDiscountValue={props.setEditDiscountValue}
              editDiscountIsPercent={props.editDiscountIsPercent}
              setEditDiscountIsPercent={props.setEditDiscountIsPercent}
              editGroupName={props.editGroupName}
              setEditGroupName={props.setEditGroupName}
              onUpdateSelectedLine={props.onUpdateSelectedLine}
              onRemoveSelectedLine={props.onRemoveSelectedLine}
              onReorderSelectedLine={props.onReorderSelectedLine}
              lineGroupName={props.lineGroupName}
              setLineGroupName={props.setLineGroupName}
              onGroupLineItems={props.onGroupLineItems}
            />
          </details>

          <details>
            <summary>LLM Pricing Assist</summary>
            <LlmPricingAssist
              busy={props.busy}
              selectedLineItemId={props.selectedLineItemId}
              llmStatus={props.llmStatus}
              llmReadyForLive={props.llmReadyForLive}
              llmBlockerReason={props.llmBlockerReason}
              onRefreshLlmStatus={props.onRefreshLlmStatus}
              llmContext={props.llmContext}
              setLlmContext={props.setLlmContext}
              llmSuggestedPrice={props.llmSuggestedPrice}
              setLlmSuggestedPrice={props.setLlmSuggestedPrice}
              llmSuggestion={props.llmSuggestion}
              onSuggestLlm={props.onSuggestLlm}
              onApplyLlmSuggestion={props.onApplyLlmSuggestion}
            />
          </details>

          <details>
            <summary>Estimate Lifecycle Actions</summary>
            <EstimateLifecycleActions
              busy={props.busy}
              selectedEstimateId={props.selectedEstimateId}
              statusTarget={props.statusTarget}
              setStatusTarget={props.setStatusTarget}
              onEstimateAction={props.onEstimateAction}
            />
          </details>
        </div>
      </div>
    </section>
  );
}
