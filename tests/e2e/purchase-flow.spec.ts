import { test, expect } from "@playwright/test";
async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill("Admin123!");
  await page.getByRole("button", { name: "サインイン" }).click();
  await page.waitForURL(/\/admin/);
}

test.describe("purchase flow", () => {
  test("unlocks paid article after checkout", async ({ page }) => {
    await loginAsAdmin(page);

    const slug = "wellness-reset-routine";
    await page.goto(`/posts/${slug}`);

    const upsell = page.getByText("全文を読むには");
    await expect(upsell).toBeVisible();

    const button = page.getByRole("button", { name: /で購入する/ });
    await button.click();

    await page.waitForURL(/status=success/);

    await expect(page.getByText("全文を読むには")).not.toBeVisible();
  });
});
