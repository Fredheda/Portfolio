import { defineConfig, devices } from '@playwright/test';
import { BACKEND_PORT, BACKEND_URL, MCP_KEY, MCP_PORT, WEB_PORT, WEB_URL } from './e2e/env.js';

const pythonEnv = {
  PYTHONPATH: '..',
  E2E_MCP_PORT: String(MCP_PORT),
  E2E_MCP_KEY: MCP_KEY,
  E2E_BACKEND_PORT: String(BACKEND_PORT),
};

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
  // Started in this order, each waited for: the backend loads its tools from
  // the MCP server at startup. server.js gets BACKEND_URL only, so its
  // production AGENT_URL default is what the tests use.
  webServer: [
    {
      command: 'poetry run python -m e2e_backend.mcp_server',
      cwd: '../backend',
      env: pythonEnv,
      url: `http://127.0.0.1:${MCP_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
    },
    {
      command: 'poetry run python -m e2e_backend.backend_server',
      cwd: '../backend',
      env: pythonEnv,
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
    },
    {
      command: 'node server.js',
      env: {
        PORT: String(WEB_PORT),
        BACKEND_URL,
        RUN_RATE_LIMIT: '1000',
        WARMUP_RATE_LIMIT: '1000',
      },
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
