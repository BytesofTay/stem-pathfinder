import { defineConfig } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4191",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node server.js",
    env: {
      PORT: "4191",
      HOST: "127.0.0.1",
      STEM_PATH_DB: path.join(process.cwd(), "data", "playwright.sqlite"),
    },
    url: "http://127.0.0.1:4191/api/health",
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
