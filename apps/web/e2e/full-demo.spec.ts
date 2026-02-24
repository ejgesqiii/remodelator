import { expect, test } from "@playwright/test";

test("full local demo workflow", async ({ page }) => {
  test.setTimeout(120_000);

  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;
  const idemKey = `e2e-charge-${unique}`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Remodelator vNext Web Console" })).toBeVisible();

  const registerForm = page.locator("form").first();
  await registerForm.getByPlaceholder("Email").fill(email);
  await registerForm.getByPlaceholder("Password").fill("pw123456");
  await registerForm.getByPlaceholder("Full name").fill("E2E Demo User");
  await registerForm.getByRole("button", { name: "Create User" }).click();

  await expect(page.getByText(`Signed in: ${email}`)).toBeVisible();

  await page.getByRole("button", { name: "Session" }).click();
  await page.getByPlaceholder("Full name").nth(1).fill("E2E Updated User");
  await page.getByPlaceholder("Labor rate").fill("82.50");
  await page.getByPlaceholder("Default item markup %").fill("12.00");
  await page.getByPlaceholder("Default estimate markup %").fill("6.00");
  await page.getByPlaceholder("Tax rate %").fill("8.75");
  await page.getByRole("button", { name: "Save Profile" }).click();
  await expect(page.getByText("Profile defaults saved.")).toBeVisible();

  await page.getByRole("button", { name: "Workspace" }).click();
  await page.getByPlaceholder("Title").fill(`E2E Kitchen ${unique}`);
  await page.getByPlaceholder("Customer name").first().fill("E2E Customer");
  await page.getByRole("button", { name: "Create" }).click();
  const createdEstimateButton = page.getByRole("button", { name: new RegExp(`E2E Kitchen ${unique}`) }).first();
  await expect(createdEstimateButton).toBeVisible();
  await createdEstimateButton.click();

  await page.locator("summary", { hasText: "Estimate Details" }).click();
  await page.getByPlaceholder("Customer email").fill("customer@example.com");
  await page.getByPlaceholder("Customer phone").fill("555-0101");
  await page.getByPlaceholder("Job address").fill("123 Demo Street");
  await page.getByPlaceholder("Estimate markup %").fill("7.25");
  await page.getByPlaceholder("Tax rate %").fill("8.50");
  await page.getByRole("button", { name: "Save Estimate Details" }).click();

  await page.locator("summary", { hasText: "Quick Start from Catalog" }).click();
  await page.getByRole("button", { name: "Add Starter Items" }).click();
  await expect(page.getByRole("button", { name: /Shower Tile/ }).first()).toBeVisible();

  await page.getByPlaceholder("Line item").fill("Custom Tile Install");
  await page.getByPlaceholder("Qty").first().fill("2");
  await page.getByPlaceholder("Unit price").first().fill("45.00");
  await page.getByPlaceholder("Labor hours").first().fill("1.5");
  await page.getByPlaceholder("Item markup %").first().fill("11.0");
  await page.getByPlaceholder("Discount value").first().fill("5.0");
  await page.getByPlaceholder("Group").first().fill("Phase-1");
  await page.getByLabel("Discount is percent").first().check();
  await page.getByRole("button", { name: "Add Line Item" }).click();

  await page.getByPlaceholder("Line item").fill("Paint Walls");
  await page.getByPlaceholder("Qty").first().fill("4");
  await page.getByPlaceholder("Unit price").first().fill("18.50");
  await page.getByRole("button", { name: "Add Line Item" }).click();

  await page.getByRole("button", { name: /Custom Tile Install/ }).first().click();
  await page.locator("summary", { hasText: "Line Item Actions" }).click();
  await page.getByPlaceholder("Selected line qty").fill("3");
  await page.getByPlaceholder("Selected line unit price").fill("47.00");
  await page.getByRole("button", { name: "Update Selected Line" }).click();

  await page.locator("summary", { hasText: "LLM Pricing Assist" }).click();
  await page.getByRole("button", { name: "Refresh LLM Status" }).click();
  const llmBlockers = page.getByText(/LLM BLOCKER:/);
  const hasLlmBlocker = (await llmBlockers.count()) > 0;
  if (hasLlmBlocker) {
    await expect(llmBlockers.first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Suggest Price" })).toBeDisabled();
  } else {
    await page.getByRole("button", { name: "Suggest Price" }).click();
    await expect(page.getByText(/LLM suggest \(OpenRouter required\):/)).toBeVisible();
    const suggestionLabel = page.getByText("Suggested unit price");
    if (await suggestionLabel.isVisible()) {
      await page.getByRole("button", { name: "Apply Suggestion" }).click();
    }
  }

  await page.locator("summary", { hasText: "Estimate Lifecycle Actions" }).click();
  await page.getByRole("button", { name: "Recalc" }).click();

  await page.getByRole("button", { name: "Catalog + Templates" }).click();
  await page.getByRole("button", { name: "Save from Selected Estimate" }).click();
  await expect(page.getByRole("button", { name: /Kitchen Base Template/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Apply to Selected Estimate" }).click();

  await page.getByRole("button", { name: "Catalog + Templates" }).click();
  await page.getByPlaceholder("Search catalog items").fill("counter");
  const searchButton = page.getByRole("button", { name: "Search" });
  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await page.getByRole("button", { name: "Add to estimate" }).first().click();

  await page.getByRole("button", { name: "Catalog + Templates" }).click();
  const exportButton = page.getByRole("button", { name: "Export Estimate" });
  await expect(exportButton).toBeEnabled();
  await exportButton.click();
  await expect(page.getByText("Estimate export written to:")).toBeVisible();
  await page.getByRole("button", { name: "Generate Proposal PDF" }).click();
  await expect(page.getByText("Proposal PDF generated at:")).toBeVisible();

  await page.getByRole("button", { name: "Billing + Output" }).click();
  await page.getByRole("button", { name: "Render Proposal" }).click();
  await expect(page.getByText("Proposal:")).toBeVisible();
  const billingResultGrid = page.locator("h3", { hasText: "Billing Response" }).locator("xpath=following-sibling::div[1]/div");
  const billingStatusCell = billingResultGrid.locator(".stat-cell").filter({ hasText: "Idempotency" }).first().locator("strong");
  const billingEventCell = billingResultGrid.locator(".stat-cell").filter({ hasText: "Event" }).first().locator("strong");

  await page.getByPlaceholder("Idempotency key for billing (optional)").fill(idemKey);
  await page.getByRole("button", { name: /Simulate Estimate Charge/ }).click();
  await expect(billingStatusCell).toHaveText("Created");
  await page.getByRole("button", { name: /Simulate Estimate Charge/ }).click();
  await expect(billingStatusCell).toHaveText("Replayed");

  await page.getByPlaceholder("Idempotency key for billing (optional)").fill("");
  await page.getByRole("button", { name: /Simulate Subscription/ }).click();
  await expect(billingEventCell).toHaveText("Subscription");
  await page.getByRole("button", { name: "Simulate Refund" }).click();
  await expect(billingEventCell).toHaveText("Refund");

  await page.getByRole("button", { name: "Admin + Logs" }).click();
  await page.getByRole("button", { name: "Summary" }).click();
  await expect(page.getByText("Billing Total")).toBeVisible();
  await page.getByRole("button", { name: "Demo Reset" }).click();
  await expect(page.getByText("No active session")).toBeVisible();
});
