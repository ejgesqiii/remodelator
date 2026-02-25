import { BillingEvent, BillingMutationResult, BillingPolicy, BillingProviderStatus, BillingSubscriptionState } from "../types";
import { BillingSection } from "./output/BillingSection";
import { ProposalSection } from "./output/ProposalSection";

export type OutputPanelProps = {
  busy: boolean;
  isSessionReady: boolean;
  hasSelectedEstimate: boolean;
  billingAmount: string;
  setBillingAmount: (value: string) => void;
  billingDetails: string;
  setBillingDetails: (value: string) => void;
  idempotencyKey: string;
  setIdempotencyKey: (value: string) => void;
  stripeCustomerEmail: string;
  setStripeCustomerEmail: (value: string) => void;
  stripeCardLast4: string;
  setStripeCardLast4: (value: string) => void;
  stripeSubscriptionId: string;
  setStripeSubscriptionId: (value: string) => void;
  stripeCancelReason: string;
  setStripeCancelReason: (value: string) => void;
  billingPolicy: BillingPolicy | null;
  billingProviderStatus: BillingProviderStatus | null;
  subscriptionState: BillingSubscriptionState | null;
  billingResponse: BillingMutationResult | null;
  billingLedger: BillingEvent[];
  proposalPreview: string;
  onRenderProposal: () => void;
  onSimulateEstimateCharge: () => void;
  onSimulateSubscription: () => void;
  onSimulateRefund: () => void;
  onSimulateStripeCardAttach: () => void;
  onSimulateStripeCheckoutComplete: () => void;
  onSimulateStripeUsageCharge: () => void;
  onSimulateStripeInvoicePaid: () => void;
  onSimulateStripeInvoiceFailed: () => void;
  onSimulateStripeCancelSubscription: () => void;
  onRefreshLedger: () => void;
};

export function OutputPanel(props: OutputPanelProps) {
  return (
    <section className="card">
      <h2>Billing + Proposal Output</h2>
      <p className="section-note">Stripe-like billing simulation with subscription lifecycle, usage charges, and webhook-style events.</p>
      <h3>Stripe Simulation Gateway (No Live Stripe Key Required)</h3>
      <div className="toolbar">
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateStripeCardAttach}>
          Attach Card (Sim)
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateStripeCheckoutComplete}>
          Checkout Complete (Annual)
        </button>
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onSimulateStripeUsageCharge}>
          Real-Time Pricing Charge
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateStripeInvoicePaid}>
          Webhook: invoice.paid
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateStripeInvoiceFailed}>
          Webhook: invoice.payment_failed
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateStripeCancelSubscription}>
          Cancel Subscription
        </button>
      </div>
      <div className="inline-grid">
        <input
          value={props.stripeCustomerEmail}
          onChange={(e) => props.setStripeCustomerEmail(e.target.value)}
          placeholder="Customer email for Stripe simulation"
        />
        <input value={props.stripeCardLast4} onChange={(e) => props.setStripeCardLast4(e.target.value)} placeholder="Card last4 (demo)" />
        <input
          value={props.stripeSubscriptionId}
          onChange={(e) => props.setStripeSubscriptionId(e.target.value)}
          placeholder="Subscription ID (demo)"
        />
        <input
          value={props.stripeCancelReason}
          onChange={(e) => props.setStripeCancelReason(e.target.value)}
          placeholder="Cancel reason"
        />
      </div>
      <h3>Billing Simulation Controls</h3>
      <div className="toolbar">
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onRenderProposal}>
          Render Proposal
        </button>
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onSimulateEstimateCharge}>
          Simulate Estimate Charge (Default $10)
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateSubscription}>
          Simulate Subscription (Annual)
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onSimulateRefund}>
          Simulate Refund
        </button>
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onRefreshLedger}>
          Refresh Ledger
        </button>
      </div>
      <div className="inline-grid">
        <input value={props.billingAmount} onChange={(e) => props.setBillingAmount(e.target.value)} placeholder="Billing amount (annual default 1200.00)" />
        <input value={props.billingDetails} onChange={(e) => props.setBillingDetails(e.target.value)} placeholder="Billing details (optional override)" />
      </div>
      <input
        value={props.idempotencyKey}
        onChange={(e) => props.setIdempotencyKey(e.target.value)}
        placeholder="Idempotency key for billing (optional)"
      />
      <div className="two-col">
        <BillingSection
          billingPolicy={props.billingPolicy}
          billingProviderStatus={props.billingProviderStatus}
          subscriptionState={props.subscriptionState}
          billingResponse={props.billingResponse}
          billingLedger={props.billingLedger}
        />
        <ProposalSection proposalPreview={props.proposalPreview} />
      </div>
    </section>
  );
}
