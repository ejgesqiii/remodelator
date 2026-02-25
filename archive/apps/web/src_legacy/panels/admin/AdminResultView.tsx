import { AdminResult } from "../../types";

type AdminResultViewProps = {
  adminResult: AdminResult;
};

export function AdminResultView(props: AdminResultViewProps) {
  const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
      return "Never";
    }
    return new Date(value).toLocaleString();
  };

  if (props.adminResult.kind === "none") {
    return "No admin query run.";
  }

  if (props.adminResult.kind === "demo-reset") {
    return <div className="info-strip">{props.adminResult.payload.message}</div>;
  }

  if (props.adminResult.kind === "audit-prune" || props.adminResult.kind === "audit-prune-preview") {
    return <div className="info-strip">{props.adminResult.payload.message}</div>;
  }

  if (props.adminResult.kind === "summary") {
    const summary = props.adminResult.payload;
    return (
      <div className="stat-grid">
        <div className="stat-cell">
          <span>Users</span>
          <strong>{summary.users}</strong>
        </div>
        <div className="stat-cell">
          <span>Estimates</span>
          <strong>{summary.estimates}</strong>
        </div>
        <div className="stat-cell">
          <span>Line Items</span>
          <strong>{summary.line_items}</strong>
        </div>
        <div className="stat-cell">
          <span>Billing Events</span>
          <strong>{summary.billing_events}</strong>
        </div>
        <div className="stat-cell">
          <span>Billing Total</span>
          <strong>{summary.billing_total_amount}</strong>
        </div>
        <div className="stat-cell">
          <span>Catalog Nodes / Items</span>
          <strong>{`${summary.catalog_nodes} / ${summary.catalog_items}`}</strong>
        </div>
      </div>
    );
  }

  if (props.adminResult.kind === "users") {
    return (
      <ul className="list compact">
        {props.adminResult.payload.map((row) => (
          <li key={row.id}>
            <div className="list-row">
              <span>{row.email}</span>
              <small>{new Date(row.created_at).toLocaleString()}</small>
            </div>
            <small>{row.full_name || "No full name set"}</small>
            <small>{`Role: ${row.role}`}</small>
            <small>{`Usage: ${row.estimates_count} estimates, ${row.billing_events_count} billing events, ${row.audit_events_count} activity events`}</small>
            <small>{`Last login: ${formatDateTime(row.last_login_at)}`}</small>
            <small>{`Last activity: ${formatDateTime(row.last_activity_at)}`}</small>
          </li>
        ))}
        {!props.adminResult.payload.length && <li className="empty-state">No users found.</li>}
      </ul>
    );
  }

  if (props.adminResult.kind === "activity") {
    return (
      <ul className="list compact">
        {props.adminResult.payload.map((row) => (
          <li key={row.id}>
            <div className="list-row">
              <span>{row.action}</span>
              <small>{new Date(row.created_at).toLocaleString()}</small>
            </div>
            <small>{`${row.entity_type} ${row.entity_id} | user ${row.user_id}`}</small>
          </li>
        ))}
        {!props.adminResult.payload.length && <li className="empty-state">No activity rows.</li>}
      </ul>
    );
  }

  return (
    <ul className="list compact">
      {props.adminResult.payload.map((row) => (
        <li key={row.id}>
          <div className="list-row">
            <span>{`${row.event_type} $${row.amount}`}</span>
            <small>{new Date(row.created_at).toLocaleString()}</small>
          </div>
          <small>{`user ${row.user_id}`}</small>
        </li>
      ))}
      {!props.adminResult.payload.length && <li className="empty-state">No billing ledger rows.</li>}
    </ul>
  );
}
