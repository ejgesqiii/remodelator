import { test, expect } from "@playwright/test";

test("web console loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Remodelator vNext Web Console" })).toBeVisible();
  await page.getByRole("button", { name: "Catalog + Templates" }).click();
  await expect(page.getByRole("heading", { name: "Catalog + Templates + Exports" })).toBeVisible();
  await page.getByRole("button", { name: "Admin + Logs" }).click();
  await expect(page.getByRole("heading", { name: "Admin Panel" })).toBeVisible();
});
