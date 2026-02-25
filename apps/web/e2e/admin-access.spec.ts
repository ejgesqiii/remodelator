import { expect, test } from "@playwright/test";

test("admin route is guarded and admin users can access dashboard", async ({ page }) => {
  test.setTimeout(120_000);

  const unique = Date.now();
  const regularEmail = `e2e-regular-${unique}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Regular User");
  await page.getByLabel("Email").fill(regularEmail);
  await page.locator("#password").fill("pw123456");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const adminEmail = process.env.E2E_ADMIN_USER_EMAILS?.split(",")[0]?.trim() || "admin-e2e@example.com";
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Admin User");
  await page.getByLabel("Email").fill(adminEmail);
  await page.locator("#password").fill("pw123456");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Billing Ledger" })).toBeVisible();

  const resetButton = page.getByRole("button", { name: "Reset Demo" });
  const previewButton = page.getByRole("button", { name: "Preview" });
  const pruneButton = page.getByRole("button", { name: "Prune Audit" });
  await expect(resetButton).toBeDisabled();
  await expect(previewButton).toBeDisabled();
  await expect(pruneButton).toBeDisabled();

  await page.getByLabel("x-admin-key").fill("local-admin-key");
  await expect(previewButton).toBeEnabled();
  await expect(pruneButton).toBeEnabled();
  const prunePreviewResponse = page.waitForResponse((response) => {
    return response.url().includes("/admin/audit-prune?retention_days=90&dry_run=true") && response.status() === 200;
  });
  await previewButton.click();
  await prunePreviewResponse;
  const pruneResponse = page.waitForResponse((response) => {
    return response.url().includes("/admin/audit-prune?retention_days=90&dry_run=false") && response.status() === 200;
  });
  await pruneButton.click();
  await pruneResponse;
});
