import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppHero } from "./AppHero";

describe("AppHero", () => {
  it("renders status, badges, and optional blocker banners", () => {
    render(
      <AppHero
        sessionEmail="demo@example.com"
        estimatesCount={3}
        currentTotalLabel="Current total: $152.75"
        actionStatus="Save: completed."
        actionStatusIsError={false}
        llmBlockerMessage="OPENROUTER_API_KEY is not set."
        billingBlockerMessage="STRIPE_SECRET_KEY is not configured."
      />,
    );

    expect(screen.getByRole("heading", { name: "Remodelator vNext Web Console" })).toBeVisible();
    expect(screen.getByText("Signed in: demo@example.com")).toBeVisible();
    expect(screen.getByText("Estimates: 3")).toBeVisible();
    expect(screen.getByText("Current total: $152.75")).toBeVisible();
    expect(screen.getByText("Save: completed.")).toBeVisible();
    expect(screen.getByText(/LLM dependency issue:/)).toBeVisible();
    expect(screen.getByText(/Billing dependency issue:/)).toBeVisible();
  });
});
