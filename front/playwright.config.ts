import { defineConfig, devices } from "@playwright/test";

// Las pruebas e2e usan mocks de la API (page.route), por eso nunca tocan datos reales.
const PORT = process.env.PORT ?? "3101";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://talentify-api.test";

if (apiURL.includes("render.com") && process.env.ALLOW_PROD_E2E !== "true") {
  throw new Error("No ejecutes pruebas E2E contra el backend de producción");
}

process.env.NEXT_PUBLIC_API_URL = apiURL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_URL: apiURL },
  },
  projects: [
    {
      name: "chromium",
      // usa el Chrome instalado (en local y en ubuntu-latest), sin descargar navegadores
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
