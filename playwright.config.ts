import { defineConfig, devices } from "@playwright/test";

const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: remoteBaseUrl || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chromium" } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "firefox-mobile", use: { ...devices["Pixel 7"], browserName: "firefox" } },
  ],
});
