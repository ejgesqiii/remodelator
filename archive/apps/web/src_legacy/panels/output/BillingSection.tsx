import { BillingEvent, BillingMutationResult, BillingPolicy, BillingProviderStatus, BillingSubscriptionState } from "../../types";

type BillingSectionProps = {
  billingPolicy: BillingPolicy | null;
  billingProviderStatus: BillingProviderStatus | null;
  subscriptionState: BillingSubscriptionState | null;
  billingResponse: BillingMutationResult | null;
  billingLedger: BillingEvent[];
};

function toTitle(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function BillingSection(props: BillingSectionProps) {
  const modeLabel = props.billingPolicy ? toTitle(props.billingPolicy.mode) : "Loading";
  const subscriptionStatusLabel = props.subscriptionState ? toTitle(props.subscriptionState.status) : "Not Started";
  const providerLabel = props.billingProviderStatus ? toTitle(props.billingProviderStatus.provider) : "Loading";

  return (
    <div className="stack">
      <h3>Billing Policy + Subscription State</h3>
      <div className="result-block">
        <div className="stat-grid">
          <div className="stat-cell">
            <span>Mode</span>
            <strong>{modeLabel}</strong>
          </div>
          <div className="stat-cell">
            <span>Annual</span>
            <strong>{props.billingPolicy ? `$${props.billingPolicy.annual_subscription_amount}` : "--"}</strong>
          </div>
          <div className="stat-cell">
            <span>Real-Time Pricing</span>
            <strong>{props.billingPolicy ? `$${props.billingPolicy.realtime_pricing_amount}` : "--"}</strong>
          </div>
          <div className="stat-cell">
            <span>Status</span>
            <strong>{subscriptionStatusLabel}</strong>
          </div>
          <div className="stat-cell">
            <span>Provider</span>
            <strong>{providerLabel}</strong>
          </div>
          <div className="stat-cell">
            <span>Adapter</span>
            <strong>{props.billingProviderStatus?.adapter_ready ? "Enabled" : "Not Enabled"}</strong>
          </div>
          <div className="stat-cell">
            <span>Live Ready</span>
            <strong>{props.billingProviderStatus?.ready_for_live ? "Ready" : "Blocked"}</strong>
          </div>
          <div className="stat-cell">
            <span>Subscription ID</span>
            <strong>{props.subscriptionState?.subscription_id || "n/a"}</strong>
          </div>
          <div className="stat-cell">
            <span>Last Event</span>
            <strong>{props.subscriptionState?.last_event_type || "n/a"}</strong>
          </div>
        </div>
      </div>
      <h3>Billing Response</h3>
      <div className="result-block">
        {props.billingResponse ? (
          <div className="stat-grid">
            <div className="stat-cell">
              <span>Event</span>
              <strong>{toTitle(props.billingResponse.event_type)}</strong>
            </div>
            <div className="stat-cell">
              <span>Amount</span>
              <strong>{`$${props.billingResponse.amount}`}</strong>
            </div>
            <div className="stat-cell">
              <span>Idempotency</span>
              <strong>{toTitle(props.billingResponse.idempotency_status)}</strong>
            </div>
            <div className="stat-cell">
              <span>Event ID</span>
              <strong>{props.billingResponse.billing_event_id}</strong>
            </div>
            {props.billingResponse.idempotency_key ? (
              <div className="stat-cell">
                <span>Idempotency Key</span>
                <strong>{props.billingResponse.idempotency_key}</strong>
              </div>
            ) : null}
          </div>
        ) : (
          "No billing event yet."
        )}
      </div>
      <h3>Billing Ledger</h3>
      <ul className="list compact">
        {props.billingLedger.map((row) => (
          <li key={row.id}>
            <div className="list-row">
              <span>{`${toTitle(row.event_type)} $${row.amount}`}</span>
              <small>{new Date(row.created_at).toLocaleString()}</small>
            </div>
          </li>
        ))}
        {!props.billingLedger.length && <li className="empty-state">No billing ledger rows.</li>}
      </ul>
    </div>
  );
}
