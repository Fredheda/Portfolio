import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { dbLog, humanTexts, modelCalls, resetBackend, runAgent } from '../helpers.js';

// No browser: these check backend behaviour a browser test cannot see.

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test('a run logs the user input and the reply', async ({ request }) => {
  await runAgent(request, { threadId: randomUUID(), text: 'log this' });
  expect(await dbLog(request)).toEqual([
    ['log this', 'user_input', 0],
    ['Reply to: log this', 'chatbot_response', 0],
  ]);
});

// The browser resends the whole chat on every run, so only a run that
// carries just its newest message shows whether the checkpointer remembers.
test('memory is kept per thread', async ({ request }) => {
  const threadA = randomUUID();
  await runAgent(request, { threadId: threadA, text: 'my name is Ada' });
  await runAgent(request, { threadId: threadA, text: 'what is my name' });
  expect(humanTexts((await modelCalls(request)).at(-1))).toEqual(['my name is Ada', 'what is my name']);

  await runAgent(request, { threadId: randomUUID(), text: 'hello' });
  expect(humanTexts((await modelCalls(request)).at(-1))).toEqual(['hello']);
});
