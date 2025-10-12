import { test, expect } from "@playwright/test";

test.describe("admin login flow", () => {
  test("loads login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "管理画面ログイン" })).toBeVisible();
    await expect(page.getByRole("button", { name: "サインイン" })).toBeVisible();
  });
});
