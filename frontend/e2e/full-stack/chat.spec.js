import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import {
  failNextModelCall,
  humanTexts,
  modelCalls,
  resetBackend,
  sendMessage,
  waitForPrompt,
} from '../helpers.js';

const SYSTEM_PROMPT = readFileSync(
  new URL('../../../backend/agent/system_prompt.md', import.meta.url),
  'utf8',
);

test.beforeEach(async ({ page, request }) => {
  await resetBackend(request);
  await page.goto('/');
});

test('a message reaches the model with the system prompt and all five tools, and the reply shows', async ({
  page,
  request,
}) => {
  await sendMessage(page, 'hello there');
  await expect(page.getByText('Reply to: hello there')).toBeVisible({ timeout: 15_000 });

  const calls = await modelCalls(request);
  expect(calls).toHaveLength(1);
  expect(calls[0].system.startsWith(SYSTEM_PROMPT.trim())).toBe(true);
  expect(calls[0].tools).toEqual([
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

test('clear starts a new thread', async ({ page, request }) => {
  await sendMessage(page, 'first turn');
  await expect(page.getByText('Reply to: first turn')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'clear' }).click();
  await sendMessage(page, 'second turn');
  await expect(page.getByText('Reply to: second turn')).toBeVisible({ timeout: 15_000 });

  expect(humanTexts((await modelCalls(request)).at(-1))).toEqual(['second turn']);
});
