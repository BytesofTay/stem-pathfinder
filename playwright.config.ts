import { defineConfig } from "@playwright/test";

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
    command: "python3 -m http.server 4191 --directory \"$PWD/lausd_magnet_app/web\"",
    url: "http://127.0.0.1:4191",
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
