import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the demo scenarios in docs/VERIFICATION.md.
 *
 * - Uses an installed browser (`E2E_CHANNEL`, default Microsoft Edge) — no browser download.
 * - Reuses a dev server already on `E2E_PORT` (default 3457); otherwise starts `next dev` there.
 * - Each test gets a fresh browser context → fresh cookie → its own seeded demo session.
 */
const port = Number(process.env.E2E_PORT || 3457);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // `next dev` compiles on demand; with more workers server actions took 5–10 s and timed out.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: process.env.E2E_CHANNEL || "msedge",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Edge"], channel: process.env.E2E_CHANNEL || "msedge" } }],
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
