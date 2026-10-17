import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/ui',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1320, height: 900 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: {
    command: 'node scripts/serve-export.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
