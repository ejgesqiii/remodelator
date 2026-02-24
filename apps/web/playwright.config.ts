import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoDir = dirname(dirname(appDir));
const e2eDataDir = join(repoDir, "data", ".e2e");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Tests share one local SQLite database and demo-reset side effects;
  // keep execution serial to avoid cross-test write contention.
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
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
      },
      port: 8000,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      cwd: appDir,
      port: 5173,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
