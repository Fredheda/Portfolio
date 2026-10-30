import { defineConfig, devices } from '@playwright/test';
import { WEB_URL } from './e2e/env.js';

// Tests share one backend and read its call log, so they run one at a time.
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // A test that passes only on retry fails the run.
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'server', testDir: './e2e/server' },
    { name: 'full-stack', testDir: './e2e/full-stack' },
    { name: 'a11y', testDir: './e2e/a11y' },
  ],
});
