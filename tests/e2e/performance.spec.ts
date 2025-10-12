import { test, expect } from "@playwright/test";

test.describe("performance smoke", () => {
  test("home page loads under 2.5s LCP-ish heuristic", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(2500);
  });
});
