import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5186", trace: "retain-on-failure" },
  webServer: {
    command: "node test/e2e/server.mjs",
    url: "http://127.0.0.1:5186/login",
    reuseExistingServer: process.env.HFOS_E2E_REUSE_SERVER === "true",
    timeout: 30000,
  },
});
