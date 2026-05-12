import { expect, test } from "@playwright/test";

import { BASE_URL } from "../../../config";

const FILES = ["Java.gexf", "Les Miserables.gexf", "Power Grid.gexf", "airlines.graphml"];

FILES.forEach((file) => {
  test(`Loading '${file}' should work`, async ({ page }) => {
    const params = new URLSearchParams({
      lang: "en",
      file: `${BASE_URL}/samples/${file}`,
    });

    // Use auth_debug to avoid auth redirects and keep snapshots locale-stable.
    await page.goto(`/?auth_debug&${params.toString()}`);

    // Wait for the graph to be fully loaded
    await expect(page).toHaveTitle(`Gephi Lite - ${file}`, { timeout: 30000 });
    await expect(page.locator("#graph-page .react-sigma")).toBeVisible();

    // Only compare the graph area so shared shell/header changes do not break this test.
    await expect(page.locator("#graph-page .filler")).toHaveScreenshot(`${file}.png`, { maxDiffPixelRatio: 0.01 });
  });
});
