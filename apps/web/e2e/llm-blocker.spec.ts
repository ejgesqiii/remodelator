import { expect, test } from "@playwright/test";

test("shows a fail-loud global banner when openrouter is not ready", async ({ page }) => {
  await page.route("**/api/pricing/llm/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "openrouter",
        model: "google/gemini-2.5-flash",
        api_key_configured: false,
        live_mode: "required",
        timeout_seconds: 30,
        max_retries: 2,
        simulation_available: false,
        ready_for_live: false,
        blocker_reason: "OPENROUTER_API_KEY is not set.",
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Remodelator vNext Web Console" })).toBeVisible();
  await expect(page.getByText(/LLM dependency issue: OPENROUTER_API_KEY is not set\./)).toBeVisible();
});
