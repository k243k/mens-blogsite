import { chromium } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";
import lighthouse from "lighthouse";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const reportsDir = path.resolve("reports/lighthouse");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await mkdir(reportsDir, { recursive: true });
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    const result = await playAudit({
      page,
      port: new URL(browser.wsEndpoint()).port,
      lighthouseConfig: {
        extends: "lighthouse:default",
        settings: {
          onlyCategories: ["performance"],
        },
      },
      thresholds: {
        performance: Number(process.env.LIGHTHOUSE_MIN_SCORE ?? 0.9),
      },
      reports: {
        formats: { html: true, json: true },
        name: `lighthouse-${Date.now()}`,
        directory: reportsDir,
      },
    }, { lighthouse });

    const scores = Object.fromEntries(
      Object.entries(result.lighthouseResults.categories).map(([key, value]) => [key, value.score]),
    );

    console.log("Lighthouse scores", scores);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
