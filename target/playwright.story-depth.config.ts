import { defineConfig } from '@playwright/test'
import base from '../playwright.config'
export default defineConfig({
  ...base,
  testDir: '../tests/e2e',
  outputDir: './story-depth-results',
  reporter: 'line',
  expect: { timeout: 15000 },
  use: { ...base.use, baseURL: 'http://127.0.0.1:4187' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4187',
    cwd: '..',
    url: 'http://127.0.0.1:4187',
    reuseExistingServer: true,
  },
})
