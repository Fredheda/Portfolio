// Ports and the MCP key shared by the Playwright config, the specs and the
// Python test servers (which read the same values from their env).
//
// Override a port with E2E_WEB_PORT, E2E_BACKEND_PORT or E2E_MCP_PORT. Two
// e2e runs on one machine (two worktrees) must use different ports: outside CI
// Playwright reuses a server it finds on its port, so runs on the same ports
// attach to each other's servers.

function port(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1024 || value > 65535) {
    throw new Error(`${name} must be a whole number from 1024 to 65535, got "${raw}"`);
  }
  return value;
}

export const WEB_PORT = port('E2E_WEB_PORT', 3210);
export const BACKEND_PORT = port('E2E_BACKEND_PORT', 8210);
export const MCP_PORT = port('E2E_MCP_PORT', 8211);

if (new Set([WEB_PORT, BACKEND_PORT, MCP_PORT]).size !== 3) {
  throw new Error('E2E_WEB_PORT, E2E_BACKEND_PORT and E2E_MCP_PORT must differ');
}

export const MCP_KEY = 'e2e-test-key';
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
export const MCP_URL = `http://127.0.0.1:${MCP_PORT}`;
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
