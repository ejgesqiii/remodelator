import { AdminAction, AdminFilters, AdminResult } from "../types";
import { AdminResultView } from "./admin/AdminResultView";

export type AdminPanelProps = {
  busy: boolean;
  sessionEmail: string | null;
  isSessionAdmin: boolean;
  adminKey: string;
  setAdminKey: (value: string) => void;
  adminFilters: AdminFilters;
  setAdminLimit: (value: string) => void;
  setAdminUserSearch: (value: string) => void;
  setAdminUserIdFilter: (value: string) => void;
  setAdminActivityActionFilter: (value: string) => void;
  setAdminActivityEntityTypeFilter: (value: string) => void;
  setAdminBillingEventTypeFilter: (value: string) => void;
  setAdminAuditPruneRetentionDays: (value: string) => void;
  adminResult: AdminResult;
  logLines: string[];
  demoChecklist: string[];
  externalBlockers: string[];
  onAdminRequest: (action: AdminAction) => void;
};

export function AdminPanel(props: AdminPanelProps) {
  return (
    <>
      <section className="card">
        <h2>Admin Panel</h2>
        <p className="section-note">Operational controls for demo reset, monitoring, and system inspection.</p>
        <div className="stack">
          <div className="info-strip">
            {props.isSessionAdmin && props.sessionEmail
              ? `Admin read access granted by signed-in role (${props.sessionEmail}).`
              : "Admin read access requires a valid admin key unless signed in as an admin user."}
          </div>
          <input value={props.adminKey} onChange={(e) => props.setAdminKey(e.target.value)} placeholder="Admin key" />
          <div className="inline-grid">
            <input
              value={props.adminFilters.limit}
              onChange={(e) => props.setAdminLimit(e.target.value)}
              placeholder="Limit (>=1, capped by server)"
            />
            <input
              value={props.adminFilters.userSearch}
              onChange={(e) => props.setAdminUserSearch(e.target.value)}
              placeholder="User search (users)"
            />
          </div>
          <div className="inline-grid">
            <input
              value={props.adminFilters.userId}
              onChange={(e) => props.setAdminUserIdFilter(e.target.value)}
              placeholder="User ID (activity/billing)"
            />
            <input
              value={props.adminFilters.activityAction}
              onChange={(e) => props.setAdminActivityActionFilter(e.target.value)}
              placeholder="Action filter (activity)"
            />
          </div>
          <div className="inline-grid">
            <input
              value={props.adminFilters.activityEntityType}
              onChange={(e) => props.setAdminActivityEntityTypeFilter(e.target.value)}
              placeholder="Entity type (activity)"
            />
            <input
              value={props.adminFilters.billingEventType}
              onChange={(e) => props.setAdminBillingEventTypeFilter(e.target.value)}
              placeholder="Billing event type"
            />
          </div>
          <div className="inline-grid">
            <input
              value={props.adminFilters.auditPruneRetentionDays}
              onChange={(e) => props.setAdminAuditPruneRetentionDays(e.target.value)}
              placeholder="Audit prune retention days"
            />
          </div>
          <div className="toolbar">
            <button disabled={props.busy || (!props.isSessionAdmin && !props.adminKey.trim())} onClick={() => props.onAdminRequest("summary")}>
              Summary
            </button>
            <button disabled={props.busy || (!props.isSessionAdmin && !props.adminKey.trim())} onClick={() => props.onAdminRequest("users")}>
              Users
            </button>
            <button disabled={props.busy || (!props.isSessionAdmin && !props.adminKey.trim())} onClick={() => props.onAdminRequest("activity")}>
              Activity
            </button>
            <button disabled={props.busy || (!props.isSessionAdmin && !props.adminKey.trim())} onClick={() => props.onAdminRequest("billing-ledger")}>
              Billing
            </button>
            <button disabled={props.busy || !props.adminKey.trim()} onClick={() => props.onAdminRequest("audit-prune-preview")}>
              Audit Preview
            </button>
            <button disabled={props.busy || !props.adminKey.trim()} onClick={() => props.onAdminRequest("audit-prune")}>
              Audit Prune
            </button>
            <button disabled={props.busy || !props.adminKey.trim()} className="danger" onClick={() => props.onAdminRequest("demo-reset")}>
              Demo Reset
            </button>
          </div>
          <div className="result-block">
            <AdminResultView adminResult={props.adminResult} />
          </div>
          <div className="stack">
            <h3>Demo Walkthrough Checklist</h3>
            <ul className="list compact">
              {props.demoChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <h3>External Inputs Still Needed</h3>
            {props.externalBlockers.length ? (
              <ul className="list compact">
                {props.externalBlockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="info-strip">No external blockers are currently listed.</div>
            )}
          </div>
        </div>
      </section>
      <section className="card">
        <h2>Live Log</h2>
        <p className="section-note">Recent action stream for debugging and acceptance walkthroughs.</p>
        {props.logLines.length ? (
          <ul className="timeline-list">
            {props.logLines.map((line, idx) => (
              <li key={`${idx}-${line}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <div className="result-block">No events yet.</div>
        )}
      </section>
    </>
  );
}
