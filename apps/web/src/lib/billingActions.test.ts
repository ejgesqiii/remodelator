import { describe, expect, it, vi } from "vitest";
import { createBillingActions } from "./billingActions";
import { apiRequest } from "./api";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

describe("createBillingActions", () => {
  it("submits subscription payload and updates output state", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      event_type: "subscription",
      amount: "49.00",
      billing_event_id: "evt-1",
      idempotency_status: "created",
    });

    const runWithSession = vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    });
    const runWithEstimate = vi.fn(async () => {});
    const setBillingResponse = vi.fn();
    const loadBillingLedger = vi.fn(async () => {});
    const loadSubscriptionState = vi.fn(async () => {});
    const setActivePanel = vi.fn();

    const actions = createBillingActions({
      runWithSession,
      runWithEstimate,
      billingAmount: "49.00",
      billingDetails: "monthly",
      idempotencyKey: "sub-123",
      stripeCustomerEmail: "demo@example.com",
      stripeCardLast4: "4242",
      stripeSubscriptionId: "sub_demo_001",
      stripeCancelReason: "customer_requested",
      setBillingResponse,
      loadBillingLedger,
      loadSubscriptionState,
      setActivePanel,
    });

    await actions.onSimulateSubscription();

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/billing/simulate-subscription",
      {
        method: "POST",
        body: JSON.stringify({
          amount: "49.00",
          details: "monthly",
          idempotency_key: "sub-123",
        }),
      },
      { "x-session-token": "token-1" },
    );
    expect(setBillingResponse).toHaveBeenCalledWith({
      event_type: "subscription",
      amount: "49.00",
      billing_event_id: "evt-1",
      idempotency_status: "created",
    });
    expect(loadBillingLedger).toHaveBeenCalled();
    expect(loadSubscriptionState).toHaveBeenCalled();
    expect(setActivePanel).toHaveBeenCalledWith("output");
  });

  it("submits estimate charge payload with selected estimate id", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      event_type: "estimate_charge",
      amount: "120.00",
      billing_event_id: "evt-2",
      idempotency_status: "created",
    });

    const runWithSession = vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    });
    const runWithEstimate = vi.fn(async (_label, _noSession, _noEstimate, action) => {
      await action({ "x-session-token": "token-1" }, "est-42");
    });
    const setBillingResponse = vi.fn();
    const loadBillingLedger = vi.fn(async () => {});
    const loadSubscriptionState = vi.fn(async () => {});
    const setActivePanel = vi.fn();

    const actions = createBillingActions({
      runWithSession,
      runWithEstimate,
      billingAmount: "120.00",
      billingDetails: "estimate charge",
      idempotencyKey: "",
      stripeCustomerEmail: "demo@example.com",
      stripeCardLast4: "4242",
      stripeSubscriptionId: "sub_demo_001",
      stripeCancelReason: "customer_requested",
      setBillingResponse,
      loadBillingLedger,
      loadSubscriptionState,
      setActivePanel,
    });

    await actions.onSimulateEstimateCharge();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/billing/simulate-estimate-charge",
      {
        method: "POST",
        body: JSON.stringify({
          estimate_id: "est-42",
          details: "estimate charge",
        }),
      },
      { "x-session-token": "token-1" },
    );
  });

  it("submits stripe cancel event payload", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      event_type: "subscription_canceled",
      amount: "0.00",
      billing_event_id: "evt-cancel-1",
      idempotency_status: "created",
    });

    const runWithSession = vi.fn(async (_label, _blocked, action) => {
      await action({ "x-session-token": "token-1" });
    });
    const runWithEstimate = vi.fn(async () => {});
    const setBillingResponse = vi.fn();
    const loadBillingLedger = vi.fn(async () => {});
    const loadSubscriptionState = vi.fn(async () => {});
    const setActivePanel = vi.fn();

    const actions = createBillingActions({
      runWithSession,
      runWithEstimate,
      billingAmount: "1200.00",
      billingDetails: "annual",
      idempotencyKey: "cancel-1",
      stripeCustomerEmail: "demo@example.com",
      stripeCardLast4: "4242",
      stripeSubscriptionId: "sub_demo_001",
      stripeCancelReason: "customer_requested",
      setBillingResponse,
      loadBillingLedger,
      loadSubscriptionState,
      setActivePanel,
    });

    await actions.onSimulateStripeCancelSubscription();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/billing/simulate-event",
      {
        method: "POST",
        body: JSON.stringify({
          event_type: "subscription_canceled",
          details: "stripe_sim subscription.canceled subscription_id=sub_demo_001 reason=customer_requested",
          idempotency_key: "cancel-1",
        }),
      },
      { "x-session-token": "token-1" },
    );
  });
});
