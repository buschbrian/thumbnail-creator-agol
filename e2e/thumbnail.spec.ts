import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("app shell renders with brand title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("ArcGIS Thumbnail Maker");
  await expect(page.getByText("Thumbnail Maker").first()).toBeVisible();
  await expect(page.locator(".canvas-frame canvas").first()).toBeVisible();
});

test("applies an AGOL item template and exports a PNG with embedded alt text", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Canvas size 600 by 400 pixels — change" })
    .waitFor()
    .catch(() => undefined);

  await page
    .getByRole("button", { name: /Apply template Web map/ })
    .first()
    .click();

  await expect(page.locator("calcite-list-item").first()).toBeVisible();
  await expect(page.locator("calcite-list-item")).toHaveCount(6);

  await page
    .getByRole("button", { name: /Export$/ })
    .first()
    .click();

  const download = await page.waitForEvent("download", { timeout: 30_000 });
  expect(download.suggestedFilename()).toMatch(/my-thumbnail_600x400\.png$/);

  const path = await download.path();
  const bytes = readFileSync(path);
  const asText = bytes.toString("latin1");
  expect(asText).toContain("Alt Text");
  expect(asText).toContain('web map "My thumbnail"');
});

test("export panel shows generated alt text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Export" }).click();
  await expect(page.locator(".alt-preview")).toContainText(
    'item "My thumbnail"',
  );
});
