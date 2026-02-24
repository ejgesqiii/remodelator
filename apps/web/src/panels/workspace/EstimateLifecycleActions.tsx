import { EstimateAction } from "../../types";

type EstimateLifecycleActionsProps = {
  busy: boolean;
  selectedEstimateId: string | null;
  statusTarget: string;
  setStatusTarget: (value: string) => void;
  onEstimateAction: (action: EstimateAction) => void;
};

export function EstimateLifecycleActions(props: EstimateLifecycleActionsProps) {
  return (
    <div className="stack detail-body">
      <div className="toolbar">
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onEstimateAction("recalc")}>
          Recalc
        </button>
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onEstimateAction("duplicate")}>
          Duplicate
        </button>
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onEstimateAction("version")}>
          Version
        </button>
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onEstimateAction("unlock")}>
          Unlock
        </button>
      </div>

      <div className="inline-grid">
        <select value={props.statusTarget} onChange={(e) => props.setStatusTarget(e.target.value)}>
          <option value="draft">draft</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
          <option value="locked">locked</option>
        </select>
        <button type="button" disabled={props.busy || !props.selectedEstimateId} onClick={() => props.onEstimateAction("status")}>
          Set Status
        </button>
      </div>
    </div>
  );
}
