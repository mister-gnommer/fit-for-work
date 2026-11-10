import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

// The browser tests get their own database, rebuilt with migrations and demo data on every
// run, so they never read or change dev.db.
const database = resolve("tmp/e2e/app.db");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3101" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -f ${database}* && mkdir -p tmp/e2e && npm run db:deploy && npm run db:seed:demo && npm start -- --hostname 127.0.0.1 --port 3101`,
    url: "http://127.0.0.1:3101/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: `file:${database}`,
      BETTER_AUTH_SECRET: "e2e-only-secret-e2e-only-secret-e2e-only",
      BETTER_AUTH_URL: "http://127.0.0.1:3101",
    },
  },
});
