import { GroupScope, ReorderDirection } from "../../types";

type LineItemActionsProps = {
  busy: boolean;
  selectedEstimateId: string | null;
  selectedLineItemId: string;
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
};

export function LineItemActions(props: LineItemActionsProps) {
  return (
    <div className="stack detail-body">
      <div className="inline-grid">
        <input value={props.editQuantity} onChange={(e) => props.setEditQuantity(e.target.value)} placeholder="Selected line qty" />
        <input value={props.editUnitPrice} onChange={(e) => props.setEditUnitPrice(e.target.value)} placeholder="Selected line unit price" />
      </div>
      <div className="inline-grid">
        <input value={props.editLaborHours} onChange={(e) => props.setEditLaborHours(e.target.value)} placeholder="Labor hours" />
        <input value={props.editItemMarkupPct} onChange={(e) => props.setEditItemMarkupPct(e.target.value)} placeholder="Item markup %" />
      </div>
      <div className="inline-grid">
        <input value={props.editDiscountValue} onChange={(e) => props.setEditDiscountValue(e.target.value)} placeholder="Discount value" />
        <input value={props.editGroupName} onChange={(e) => props.setEditGroupName(e.target.value)} placeholder="Group" />
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={props.editDiscountIsPercent}
          onChange={(e) => props.setEditDiscountIsPercent(e.target.checked)}
        />
        Discount is percent
      </label>

      <div className="toolbar">
        <button type="button" disabled={props.busy || !props.selectedLineItemId} onClick={props.onUpdateSelectedLine}>
          Update Selected Line
        </button>
        <button type="button" disabled={props.busy || !props.selectedLineItemId} onClick={props.onRemoveSelectedLine}>
          Remove Selected Line
        </button>
        <button type="button" disabled={props.busy || !props.selectedLineItemId} onClick={() => props.onReorderSelectedLine(-1)}>
          Move Up
        </button>
        <button type="button" disabled={props.busy || !props.selectedLineItemId} onClick={() => props.onReorderSelectedLine(1)}>
          Move Down
        </button>
      </div>

      <div className="inline-grid">
        <input value={props.lineGroupName} onChange={(e) => props.setLineGroupName(e.target.value)} placeholder="Group name" />
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onGroupLineItems("selected")}>
          Group Selected
        </button>
      </div>
      <div className="toolbar">
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onGroupLineItems("all")}>
          Group All Lines
        </button>
      </div>
    </div>
  );
}
