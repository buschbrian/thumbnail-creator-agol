import { test } from "@playwright/test";

test("screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 860 });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/shot-empty.png" });

  await page.getByRole("button", { name: "Use a template" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/shot-template.png" });

  await page.getByRole("button", { name: "Add text layer" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/shot-props.png" });

  await page.getByRole("button", { name: "Open ArcGIS style icon picker" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "test-results/shot-picker.png" });
});
