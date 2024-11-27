import { expect, test } from "@playwright/test";

import { BASE_URL } from "../vite.config.mjs";

const FILES = ["Java.gexf", "Les Miserables.gexf", "Power Grid.gexf", "airlines.graphml"];

FILES.forEach((file) => {
  test(`Loading '${file}' should work`, async ({ page }) => {
    // Load gephi-lite with the given gexf file
    await page.goto(`/?file=${BASE_URL}/samples/${file}`);

    // Wait for the graph to be fully loaded
    await expect(page).toHaveTitle(`Gephi Lite - ${file}`, { timeout: 30000 });

    // Check the screenshot
    await expect(page).toHaveScreenshot(`${file}.png`, { maxDiffPixelRatio: 0.01 });
  });
});
