import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    trace: "on-first-retry",
  },
});
