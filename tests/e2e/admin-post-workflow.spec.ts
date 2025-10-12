import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill("Admin123!");
  await page.getByRole("button", { name: "サインイン" }).click();
  await page.waitForURL(/\/admin/);
}

test.describe("admin posts", () => {
  test("creates a new draft post", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/posts/new");

    const suffix = randomUUID().slice(0, 8);
    await page.getByLabel("タイトル").fill(`Playwright Draft ${suffix}`);
    await page.getByLabel("スラッグ").fill(`playwright-draft-${suffix}`);
    await page.getByLabel("概要").fill("Playwright E2Eで作成した下書きです。");
    await page.getByLabel("本文（MDX）").fill("# Test\n\nPlaywright generated content.");

    await page.getByRole("button", { name: "作成する" }).click();

    await expect(page.getByText("記事を作成しました。"))
      .toBeVisible({ timeout: 10000 });
    await page.waitForURL(/\/admin\/posts/);
    await expect(page.getByText(`playwright-draft-${suffix}`)).toBeVisible();
  });
});
