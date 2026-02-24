import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingSection } from "./BillingSection";
import { ProposalSection } from "./ProposalSection";

describe("output section components", () => {
  it("renders billing response and ledger rows", () => {
    render(
      <BillingSection
        billingPolicy={{
          mode: "hybrid",
          annual_subscription_amount: "1200.00",
          realtime_pricing_amount: "10.00",
          currency: "USD",
        }}
        billingProviderStatus={{
          provider: "simulation",
          live_mode: "simulation",
          adapter_ready: true,
          ready_for_live: true,
          stripe_key_configured: false,
          stripe_webhook_secret_configured: false,
          blocker_reason: null,
        }}
        subscriptionState={{
          status: "active",
          active: true,
          canceled: false,
          past_due: false,
          subscription_id: "sub_demo_001",
          last_event_type: "checkout_completed",
          annual_subscription_amount: "1200.00",
          realtime_pricing_amount: "10.00",
          currency: "USD",
        }}
        billingResponse={{
          event_type: "estimate_charge",
          amount: "99.00",
          idempotency_status: "new",
          billing_event_id: "evt-1",
          idempotency_key: "idem-1",
        }}
        billingLedger={[
          {
            id: "evt-1",
            event_type: "estimate_charge",
            amount: "99.00",
            currency: "USD",
            details: "demo",
            created_at: new Date().toISOString(),
          },
        ]}
      />, 
    );

    expect(screen.getByText("Idempotency Key")).toBeInTheDocument();
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Simulation")).toBeInTheDocument();
    expect(screen.getByText("Estimate Charge $99.00")).toBeInTheDocument();
  });

  it("renders proposal preview lines", () => {
    render(<ProposalSection proposalPreview={"Line one\n\nLine two"} />);

    expect(screen.getByText("Line one")).toBeInTheDocument();
    expect(screen.getByText("Line two")).toBeInTheDocument();
  });
});
