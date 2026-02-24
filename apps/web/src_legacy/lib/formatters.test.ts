import { describe, expect, it } from "vitest";
import {
  decimalOrZero,
  formatCurrency,
  formatLlmStatus,
} from "./formatters";

describe("formatCurrency", () => {
  it("formats valid numbers to 2 decimals", () => {
    expect(formatCurrency("10")).toBe("10.00");
    expect(formatCurrency("10.234")).toBe("10.23");
  });

  it("returns input for non-numeric values", () => {
    expect(formatCurrency("abc")).toBe("abc");
  });
});

describe("formatLlmStatus", () => {
  it("renders configured live status", () => {
    const text = formatLlmStatus({
      provider: "openrouter",
      model: "google/gemini-2.5-flash",
      api_key_configured: true,
      live_mode: "required",
      timeout_seconds: 30,
      max_retries: 2,
      max_price_change_pct: "20",
      simulation_available: false,
      ready_for_live: true,
      blocker_reason: null,
    });
    expect(text).toContain("LLM: Live ready");
    expect(text).toContain("provider=openrouter");
    expect(text).toContain("retries=2");
    expect(text).toContain("max_change_pct=20");
  });
});

describe("decimalOrZero", () => {
  it("maps blank values to zero", () => {
    expect(decimalOrZero("")).toBe("0");
    expect(decimalOrZero("   ")).toBe("0");
    expect(decimalOrZero("12.5")).toBe("12.5");
  });
});
