import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd apps/web && npx vite --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd apps/marketing && npx astro dev --port 4000',
      url: 'http://localhost:4000',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    }
  ],
});
