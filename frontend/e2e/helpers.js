import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { BACKEND_URL, MCP_URL } from './env.js';
import { terminalInput } from './selectors.js';

// The test backend's routes (e2e_backend/backend_server.py).
export async function resetBackend(request) {
  expect((await request.post(`${BACKEND_URL}/__reset`)).ok()).toBe(true);
}

export async function modelCalls(request) {
  return (await request.get(`${BACKEND_URL}/__model_calls`)).json();
}

export async function dbLog(request) {
  return (await request.get(`${BACKEND_URL}/__db_log`)).json();
}

export async function failNextModelCall(request) {
  expect((await request.post(`${BACKEND_URL}/__fail`)).ok()).toBe(true);
}

// The fake MCP server's route (e2e_backend/mcp_server.py): the next search
// raises inside the real function_app.py handler.
export async function failNextSearch(request) {
  expect((await request.post(`${MCP_URL}/__fail_search`)).ok()).toBe(true);
}

// The fake blog read API's routes (e2e_backend/blog_api.py), served by the
// fake MCP server's process.
export async function resetBlog(request) {
  expect((await request.post(`${MCP_URL}/__blog_reset`)).ok()).toBe(true);
}

export async function blogCalls(request) {
  return (await request.get(`${MCP_URL}/__blog_calls`)).json();
}

// The next `count` requests to the fake read API answer 500.
export async function failBlog(request, count) {
  expect((await request.post(`${MCP_URL}/__blog_fail?count=${count}`)).ok()).toBe(true);
}

// One AG-UI run posted straight to the backend, carrying only `text`, the
// way a browser never does: earlier turns can only come from the
// checkpointer. `expectError: true` accepts a run that ends with RUN_ERROR
// instead of RUN_FINISHED (a failed run must still end with exactly one).
export async function runAgent(request, { threadId, text, expectError = false }) {
  const response = await request.post(`${BACKEND_URL}/agent/portfolio_agent`, {
    headers: { accept: 'text/event-stream' },
    data: {
      threadId,
      runId: randomUUID(),
      state: {},
      messages: [{ id: randomUUID(), role: 'user', content: text }],
      tools: [],
      context: [],
      forwardedProps: {},
    },
  });
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain(expectError ? 'RUN_ERROR' : 'RUN_FINISHED');
  return body;
}

export const humanTexts = (call) => call.messages.filter((m) => m.type === 'human').map((m) => m.text);

// The prompt only shows once the hero has booted and no reply is in flight.
export async function waitForPrompt(page) {
  await expect(terminalInput(page)).toBeVisible({ timeout: 30_000 });
}

export async function sendMessage(page, text) {
  await waitForPrompt(page);
  await terminalInput(page).fill(text);
  await terminalInput(page).press('Enter');
}
