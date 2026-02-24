import { apiRequest } from "./api";
import { BillingMutationResult } from "../types";

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

type CreateBillingActionsOptions = {
  runWithSession: RunWithSession;
  runWithEstimate: RunWithEstimate;
  billingAmount: string;
  billingDetails: string;
  idempotencyKey: string;
  stripeCustomerEmail: string;
  stripeCardLast4: string;
  stripeSubscriptionId: string;
  stripeCancelReason: string;
  loadBillingLedger: () => Promise<void>;
  loadSubscriptionState: () => Promise<void>;
  setBillingResponse: (value: BillingMutationResult) => void;
  setActivePanel: (panel: "output") => void;
};

export function createBillingActions(options: CreateBillingActionsOptions) {
  const runBillingMutation = async (label: string, endpoint: string, payload: Record<string, string>) => {
    await options.runWithSession(label, `${label} blocked: login required`, async (headers) => {
      const result = await apiRequest<BillingMutationResult>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        headers,
      );
      options.setBillingResponse(result);
      await Promise.all([options.loadBillingLedger(), options.loadSubscriptionState()]);
      options.setActivePanel("output");
    });
  };

  const appendIdempotency = (payload: Record<string, string>) => {
    if (options.idempotencyKey.trim()) {
      payload.idempotency_key = options.idempotencyKey.trim();
    }
    return payload;
  };

  const runGatewayEvent = async (label: string, payload: Record<string, string>) => {
    await runBillingMutation(label, "/billing/simulate-event", appendIdempotency(payload));
  };

  const onSimulateEstimateCharge = async () => {
    await options.runWithEstimate(
      "Simulate estimate charge",
      "Billing blocked: login required",
      "Billing blocked: select an estimate",
      async (_headers, estimateId) => {
        const payload = appendIdempotency({
          estimate_id: estimateId,
          details: options.billingDetails,
        });
        await runBillingMutation("Simulate estimate charge", "/billing/simulate-estimate-charge", payload);
      },
    );
  };

  const onSimulateSubscription = async () => {
    const payload = appendIdempotency({
      amount: options.billingAmount,
      details: options.billingDetails,
    });
    await runBillingMutation("Simulate subscription", "/billing/simulate-subscription", payload);
  };

  const onSimulateRefund = async () => {
    const payload = appendIdempotency({
      amount: options.billingAmount,
      details: options.billingDetails,
    });
    await runBillingMutation("Simulate refund", "/billing/simulate-refund", payload);
  };

  const onSimulateStripeCardAttach = async () => {
    const cleanLast4 = (options.stripeCardLast4.replace(/\D/g, "").slice(-4) || "4242").padStart(4, "0");
    const email = options.stripeCustomerEmail.trim() || "demo@example.com";
    await runGatewayEvent("Simulate Stripe card attach", {
      event_type: "payment_method_attached",
      details: `stripe_sim payment_method_attached email=${email} card_last4=${cleanLast4}`,
    });
  };

  const onSimulateStripeCheckoutComplete = async () => {
    const email = options.stripeCustomerEmail.trim() || "demo@example.com";
    await runGatewayEvent("Simulate Stripe checkout complete", {
      event_type: "checkout_completed",
      amount: options.billingAmount,
      details: `stripe_sim checkout_completed email=${email}`,
    });
  };

  const onSimulateStripeUsageCharge = async () => {
    await options.runWithEstimate(
      "Simulate Stripe usage charge",
      "Stripe usage charge blocked: login required",
      "Stripe usage charge blocked: select an estimate",
      async (_headers, estimateId) => {
        await runGatewayEvent("Simulate Stripe usage charge", {
          event_type: "usage_charge",
          details: `stripe_sim usage_charge estimate_id=${estimateId}`,
        });
      },
    );
  };

  const onSimulateStripeInvoicePaid = async () => {
    const subscriptionId = options.stripeSubscriptionId.trim() || "sub_demo_001";
    await runGatewayEvent("Simulate Stripe invoice paid webhook", {
      event_type: "invoice_paid",
      details: `stripe_sim webhook invoice.paid subscription_id=${subscriptionId}`,
    });
  };

  const onSimulateStripeInvoiceFailed = async () => {
    const subscriptionId = options.stripeSubscriptionId.trim() || "sub_demo_001";
    await runGatewayEvent("Simulate Stripe invoice payment failed webhook", {
      event_type: "invoice_payment_failed",
      details: `stripe_sim webhook invoice.payment_failed subscription_id=${subscriptionId}`,
    });
  };

  const onSimulateStripeCancelSubscription = async () => {
    const subscriptionId = options.stripeSubscriptionId.trim() || "sub_demo_001";
    const reason = options.stripeCancelReason.trim() || "customer_requested";
    await runGatewayEvent("Simulate Stripe subscription cancel", {
      event_type: "subscription_canceled",
      details: `stripe_sim subscription.canceled subscription_id=${subscriptionId} reason=${reason}`,
    });
  };

  return {
    onSimulateEstimateCharge,
    onSimulateSubscription,
    onSimulateRefund,
    onSimulateStripeCardAttach,
    onSimulateStripeCheckoutComplete,
    onSimulateStripeUsageCharge,
    onSimulateStripeInvoicePaid,
    onSimulateStripeInvoiceFailed,
    onSimulateStripeCancelSubscription,
  };
}
