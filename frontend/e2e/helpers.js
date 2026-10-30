import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { BACKEND_URL } from './env.js';
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

// One AG-UI run posted straight to the backend, carrying only `text`, the
// way a browser never does: earlier turns can only come from the
// checkpointer.
export async function runAgent(request, { threadId, text }) {
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
  expect(body).toContain('RUN_FINISHED');
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
