import { expect, test } from "@playwright/test";

test("filters edges by an inclusive date range", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edge dates demo", exact: true }).click();
  await expect(page).toHaveTitle("Gephi Lite - edge-dates.gexf", { timeout: 30000 });

  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByRole("button", { name: "Add filter" }).click();
  await page.getByRole("button", { name: "createdAt" }).click();

  await page.getByLabel("From").fill("2025-01-01");
  await page.getByLabel("To").fill("2025-01-31");

  await expect(page.getByText("8 nodes, 2 edges", { exact: true })).toBeVisible();

  await page.getByLabel("Keep missing values").uncheck();
  await expect(page.getByText("8 nodes, 1 edge", { exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: /createdAt/ })
    .first()
    .click();
  await expect(page.getByText("8 nodes, 16 edges", { exact: true })).toBeVisible();
});
