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

test("downloads an editable project with embedded local images and unchanged history", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.locator('.tab-body input[type="file"]').setInputFiles({
    name: "trail-background.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator("calcite-list-item")).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download editable project" })
    .click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("my-thumbnail.thumbnail.json");
  const path = await download.path();
  const json = readFileSync(path, "utf8");
  const project = JSON.parse(json) as {
    format: string;
    version: number;
    layers: Array<{ src?: string }>;
  };
  expect(project.format).toBe("thumbnail-maker-design");
  expect(project.version).toBe(1);
  expect(json).not.toContain("blob:");
  expect(project.layers[0].src).toMatch(/^data:image\/png;base64,/);

  await page.getByRole("button", { name: "Undo (Ctrl+Z)" }).click();
  await expect(page.locator("calcite-list-item")).toHaveCount(0);
});

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
]) {
  test(`brand workspace fits without horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Brand" }).click();

    const panel = page.locator(".rail-content");
    await expect(
      page.getByRole("heading", { name: /Organization brand/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Import mode" }),
    ).toBeVisible();

    const dimensions = await panel.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    const shareKit = page.getByRole("heading", { name: "Share kit" });
    await shareKit.scrollIntoViewIfNeeded();
    await expect(shareKit).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export .brandkit.json" }),
    ).toBeVisible();

    const clearAll = page.getByRole("button", { name: "Clear all" });
    await clearAll.click();
    await expect(page.getByRole("button", { name: "Confirm?" })).toBeVisible();
  });
}
