import { test, expect } from "@playwright/test";

async function registerAndEnterApp(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Smoke Test User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill("pw123456");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test("web console loads", async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;
  await registerAndEnterApp(page, email);

  const sidebar = page.locator("aside");
  await sidebar.getByRole("link", { name: "Catalog", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Templates", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Billing", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Billing", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
