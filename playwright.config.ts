import { defineConfig } from "@playwright/test";

// Ujian aliran Electron (`_electron`), dijalankan dalam xvfb oleh scripts/gerbang-ujian.sh. Satu pekerja: satu tetingkap app.
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
});
