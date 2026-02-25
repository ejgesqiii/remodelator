import { expect, test } from "@playwright/test";

test("shows a fail-loud global banner when openrouter is not ready", async ({ page }) => {
  await page.route("**/pricing/llm/status", async (route) => {
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

  const email = `llm-blocker-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("LLM Blocker User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill("pw123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("LLM: OPENROUTER_API_KEY is not set.")).toBeVisible();
});
