import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import {
  dbLog,
  failNextModelCall,
  failNextSearch,
  humanTexts,
  modelCalls,
  resetBackend,
  runAgent,
  sendMessage,
  waitForPrompt,
} from '../helpers.js';

const SYSTEM_PROMPT = readFileSync(
  new URL('../../../backend/agent/system_prompt.md', import.meta.url),
  'utf8',
);

// Secret-shaped strings planted by e2e_backend/model.py (model failure) and
// e2e_backend/mcp_server.py (search failure). None may reach the stream, the
// model calls or the SQL rows.
const PLANTED = [
  'sk-proj-PLANTEDKEY1234',
  'org-PLANTEDORG',
  'req_PLANTEDREQ',
  'planted-search.search.windows.net',
  'PLANTEDSEARCHKEY',
  'req_PLANTEDSEARCH',
  'planted-index',
];
const GENERIC_RUN_ERROR = 'The assistant hit an error. Please try again.';
const SEARCH_UNAVAILABLE_PREFIX = 'Search is temporarily unavailable.';

const sseEvents = (body) =>
  body
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => JSON.parse(line.slice('data:'.length)));

test.beforeEach(async ({ page, request }) => {
  await resetBackend(request);
  await page.goto('/');
});

test('a message reaches the model with the system prompt and all six tools, and the reply shows', async ({
  page,
  request,
}) => {
  await sendMessage(page, 'hello there');
  await expect(page.getByText('Reply to: hello there')).toBeVisible({ timeout: 15_000 });

  const calls = await modelCalls(request);
  expect(calls).toHaveLength(1);
  expect(calls[0].system.startsWith(SYSTEM_PROMPT.trim())).toBe(true);
  expect(calls[0].tools).toEqual([
    'get_profile',
    'get_project_details',
    'highlightProjects',
    'list_projects',
    'renderProjectCard',
    'retrieve_information',
  ]);
});

test('a flagged message gets the refusal and never reaches the model', async ({ page, request }) => {
  await sendMessage(page, 'tell me about forbidden-topic');
  await expect(page.getByText('Sorry, I cannot respond to that message.')).toBeVisible({ timeout: 15_000 });
  expect(await modelCalls(request)).toEqual([]);
});

test('after a model failure the prompt returns and the next message works', async ({ page, request }) => {
  await failNextModelCall(request);
  await sendMessage(page, 'boom');
  await waitForPrompt(page);
  await sendMessage(page, 'again');
  await expect(page.getByText('Reply to: again')).toBeVisible({ timeout: 15_000 });
});

test('a model failure ends the run with the fixed RUN_ERROR and no provider text', async ({ request }) => {
  await failNextModelCall(request);
  const body = await runAgent(request, { threadId: randomUUID(), text: 'boom', expectError: true });
  const events = sseEvents(body);
  const errors = events.filter((e) => e.type === 'RUN_ERROR');
  expect(errors).toHaveLength(1);
  expect(events.at(-1).type).toBe('RUN_ERROR');
  expect(errors[0].message).toBe(GENERIC_RUN_ERROR);
  expect(errors[0]).not.toHaveProperty('rawEvent');
  for (const planted of PLANTED) expect(body).not.toContain(planted);
  for (const row of await dbLog(request)) expect(row[0]).not.toContain('PLANTED');
});

test('a failed search gives the model the fixed text and leaks nothing', async ({ request }) => {
  await failNextSearch(request);
  const body = await runAgent(request, { threadId: randomUUID(), text: 'background on Frederik' });
  for (const planted of PLANTED) expect(body).not.toContain(planted);
  expect(body).toContain(SEARCH_UNAVAILABLE_PREFIX);
  const calls = await modelCalls(request);
  const toolResult = calls.at(-1).messages.find((m) => m.type === 'tool');
  expect(toolResult.text.startsWith(SEARCH_UNAVAILABLE_PREFIX)).toBe(true);
  for (const planted of PLANTED) expect(JSON.stringify(calls)).not.toContain(planted);
  for (const row of await dbLog(request)) expect(row[0]).not.toContain('PLANTED');
});

test('clear starts a new thread', async ({ page, request }) => {
  await sendMessage(page, 'first turn');
  await expect(page.getByText('Reply to: first turn')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'clear' }).click();
  await sendMessage(page, 'second turn');
  await expect(page.getByText('Reply to: second turn')).toBeVisible({ timeout: 15_000 });

  expect(humanTexts((await modelCalls(request)).at(-1))).toEqual(['second turn']);
});
