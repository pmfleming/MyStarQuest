import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/offline-browser',
  timeout: 90_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4184', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4184 --strictPort',
    url: 'http://127.0.0.1:4184',
    reuseExistingServer: !process.env.CI,
  },
})
