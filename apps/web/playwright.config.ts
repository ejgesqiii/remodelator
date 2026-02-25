import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoDir = dirname(dirname(appDir));
const e2eDataDir = join(repoDir, "data", ".e2e");
const apiPort = Number(process.env.E2E_API_PORT ?? "8000");
const webPort = Number(process.env.E2E_WEB_PORT ?? "5173");
const apiHost = process.env.E2E_API_HOST ?? "127.0.0.1";
const webHost = process.env.E2E_WEB_HOST ?? "127.0.0.1";
const apiBaseUrl = `http://${apiHost}:${apiPort}`;
const webBaseUrl = `http://${webHost}:${webPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Tests share one local SQLite database and demo-reset side effects;
  // keep execution serial to avoid cross-test write contention.
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? webBaseUrl,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "sh -lc 'rm -rf \"$REMODELATOR_DATA_DIR\" && mkdir -p \"$REMODELATOR_DATA_DIR\" && " +
        "remodelator db migrate --json >/dev/null && remodelator db seed --json >/dev/null && ./scripts/run_api.sh'",
      cwd: repoDir,
      env: {
        ...process.env,
        REMODELATOR_DATA_DIR: e2eDataDir,
        REMODELATOR_API_HOST: apiHost,
        REMODELATOR_API_PORT: String(apiPort),
        REMODELATOR_BILLING_PROVIDER: process.env.E2E_BILLING_PROVIDER ?? "simulation",
        REMODELATOR_ADMIN_USER_EMAILS: process.env.E2E_ADMIN_USER_EMAILS ?? "admin-e2e@example.com",
        REMODELATOR_CORS_ORIGINS: `${webBaseUrl},http://localhost:${webPort}`,
      },
      port: apiPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host ${webHost} --port ${webPort}`,
      cwd: appDir,
      env: {
        ...process.env,
        VITE_API_PROXY_TARGET: apiBaseUrl,
        VITE_API_URL: apiBaseUrl,
      },
      port: webPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
