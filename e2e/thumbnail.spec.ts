import { expect, test } from "@playwright/test";

test("app shell renders with brand title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("ArcGIS Thumbnail Maker");
  await expect(page.getByText("ArcGIS Thumbnail Maker").first()).toBeVisible();
});

test("adds text, applies a template, and exports a PNG", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Text", exact: true }).click();
  const canvas = page.locator(".canvas-frame canvas").first();
  await expect(canvas).toBeVisible();

  await page
    .getByRole("button", { name: /Apply template Footer band/ })
    .first()
    .click();

  await expect(page.locator("calcite-list-item")).toHaveCount(4);

  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("button", { name: /Download PNG/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/my-thumbnail_600x400\.png$/);
});
