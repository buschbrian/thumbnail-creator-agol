import { defineConfig, devices } from "@playwright/test";

const chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173/thumbnail-creator-agol/",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromeExecutablePath
          ? { launchOptions: { executablePath: chromeExecutablePath } }
          : { channel: "chrome" }),
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/thumbnail-creator-agol/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
