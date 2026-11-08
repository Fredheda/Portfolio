import { afterEach, describe, expect, it, vi } from 'vitest';

const NAMES = ['E2E_WEB_PORT', 'E2E_BACKEND_PORT', 'E2E_MCP_PORT'];

// A fresh copy of env.js per case, with all three variables blanked first so a
// value exported in the caller's shell cannot change a result.
async function load(overrides = {}) {
  vi.resetModules();
  for (const name of NAMES) vi.stubEnv(name, '');
  for (const [name, value] of Object.entries(overrides)) vi.stubEnv(name, value);
  return import('./env.js');
}

afterEach(() => vi.unstubAllEnvs());

describe('e2e ports', () => {
  it('default to 3210, 8210 and 8211', async () => {
    const env = await load();
    expect([env.WEB_PORT, env.BACKEND_PORT, env.MCP_PORT]).toEqual([3210, 8210, 8211]);
    expect(env.WEB_URL).toBe('http://127.0.0.1:3210');
    expect(env.BACKEND_URL).toBe('http://127.0.0.1:8210');
  });

  it('come from E2E_WEB_PORT, E2E_BACKEND_PORT and E2E_MCP_PORT', async () => {
    const env = await load({ E2E_WEB_PORT: '3310', E2E_BACKEND_PORT: '8310', E2E_MCP_PORT: '8311' });
    expect([env.WEB_PORT, env.BACKEND_PORT, env.MCP_PORT]).toEqual([3310, 8310, 8311]);
    expect(env.WEB_URL).toBe('http://127.0.0.1:3310');
    expect(env.BACKEND_URL).toBe('http://127.0.0.1:8310');
  });

  it('can override one port and keep the other defaults', async () => {
    const env = await load({ E2E_BACKEND_PORT: '8999' });
    expect([env.WEB_PORT, env.BACKEND_PORT, env.MCP_PORT]).toEqual([3210, 8999, 8211]);
  });

  it('reject a value that is not a whole number, naming the variable', async () => {
    await expect(load({ E2E_WEB_PORT: 'abc' })).rejects.toThrow(/E2E_WEB_PORT/);
    await expect(load({ E2E_MCP_PORT: '82.5' })).rejects.toThrow(/E2E_MCP_PORT/);
  });

  it('reject a port outside 1024 to 65535', async () => {
    await expect(load({ E2E_BACKEND_PORT: '80' })).rejects.toThrow(/E2E_BACKEND_PORT/);
    await expect(load({ E2E_BACKEND_PORT: '70000' })).rejects.toThrow(/E2E_BACKEND_PORT/);
  });

  it('reject two equal ports', async () => {
    await expect(load({ E2E_WEB_PORT: '8210' })).rejects.toThrow(/must differ/);
  });
});
