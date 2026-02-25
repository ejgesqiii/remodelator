import { expect, test } from "@playwright/test";

test("full local demo workflow", async ({ page }) => {
  test.setTimeout(120_000);

  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;
  const estimateTitle = `E2E Kitchen ${unique}`;
  const billingKey = `e2e-billing-${unique}`;

  // Register + land on authenticated dashboard.
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Demo User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill("pw123456");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Create estimate.
  await page.getByRole("link", { name: "Estimates" }).click();
  await expect(page.getByRole("heading", { name: "Estimates" })).toBeVisible();
  await page.getByRole("button", { name: "New Estimate" }).click();
  await page.getByPlaceholder("e.g. Smith Bathroom Remodel").fill(estimateTitle);
  await page.getByPlaceholder("e.g. Jane Smith").fill("E2E Customer");
  const createForm = page.locator("form").filter({
    has: page.getByPlaceholder("e.g. Smith Bathroom Remodel"),
  });
  await createForm.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Estimate created")).toBeVisible();

  // Open estimate details and add an item from catalog picker.
  await page.getByRole("link", { name: estimateTitle }).first().click();
  await expect(page.getByRole("heading", { name: estimateTitle })).toBeVisible();
  await page.getByRole("button", { name: /Add Item/ }).click();
  await expect(page.getByText("Catalog Picker")).toBeVisible();
  await page.getByRole("button", { name: "Kitchen" }).click();
  await page.getByRole("button", { name: "Add Countertop Install" }).click();
  await expect(page.getByText("Line item added")).toBeVisible();

  // Recalculate totals and verify item is visible.
  await page.getByRole("button", { name: "Recalculate" }).click();
  await expect(page.getByText("Totals recalculated")).toBeVisible();
  await expect(page.getByRole("button", { name: "Countertop Install", exact: true })).toBeVisible();

  // Proposal view.
  await page.getByRole("link", { name: "View Proposal" }).click();
  await expect(page.getByRole("heading", { name: "Proposal" })).toBeVisible();

  // Billing actions.
  await page.getByRole("link", { name: "Billing" }).click();
  await expect(page.getByRole("heading", { name: "Billing", exact: true })).toBeVisible();
  await page.getByPlaceholder("e.g. test-key-123").fill(billingKey);
  await page.getByRole("button", { name: "Complete Checkout" }).click();
  await expect(page.getByText("Subscription: subscription")).toBeVisible();
  await page.getByPlaceholder("e.g. test-key-123").fill("");
  await page.getByRole("button", { name: "Run Charge" }).click();
  await expect(page.getByText("Charge: 10.00")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Billing Ledger/ })).toBeVisible();

  // Settings update.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page
    .locator('label:has-text("Full Name")')
    .locator("xpath=following-sibling::input[1]")
    .fill("E2E Updated User");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile updated")).toBeVisible();
});
