// Ports and the MCP key shared by the Playwright config, the specs and the
// Python test servers (which read the same values from their env).
export const WEB_PORT = 3210;
export const BACKEND_PORT = 8210;
export const MCP_PORT = 8211;
export const MCP_KEY = 'e2e-test-key';
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
