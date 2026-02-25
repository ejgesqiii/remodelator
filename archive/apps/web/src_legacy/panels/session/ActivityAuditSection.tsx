import { ActivitySummary, AuditEntry } from "../../types";

type ActivityAuditSectionProps = {
  busy: boolean;
  isSessionReady: boolean;
  activitySummary: ActivitySummary | null;
  auditTrail: AuditEntry[];
  onRefreshActivity: () => void;
};

export function ActivityAuditSection(props: ActivityAuditSectionProps) {
  return (
    <div className="two-col section-split">
      <div className="stack">
        <h3>My Activity Snapshot</h3>
        <div className="toolbar">
          <button type="button" disabled={props.busy || !props.isSessionReady} onClick={props.onRefreshActivity}>
            Refresh Activity
          </button>
        </div>
        {!props.activitySummary && <div className="empty-state">No activity summary yet.</div>}
        {props.activitySummary && (
          <div className="stat-grid">
            <div className="stat-cell">
              <span>Estimates</span>
              <strong>{props.activitySummary.estimates}</strong>
            </div>
            <div className="stat-cell">
              <span>Line Items</span>
              <strong>{props.activitySummary.line_items}</strong>
            </div>
            <div className="stat-cell">
              <span>Billing Events</span>
              <strong>{props.activitySummary.billing_events}</strong>
            </div>
            <div className="stat-cell">
              <span>Audit Events</span>
              <strong>{props.activitySummary.audit_events}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="stack">
        <h3>Recent Audit Trail</h3>
        {!props.auditTrail.length && <div className="empty-state">No audit events yet.</div>}
        {!!props.auditTrail.length && (
          <ul className="list compact">
            {props.auditTrail.map((event) => (
              <li key={event.id}>
                <div className="list-row">
                  <span>{event.action}</span>
                  <small>{new Date(event.created_at).toLocaleString()}</small>
                </div>
                <small>{`${event.entity_type} ${event.entity_id}`}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
