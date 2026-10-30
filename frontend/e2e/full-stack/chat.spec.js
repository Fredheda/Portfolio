import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { modelCalls, resetBackend, sendMessage } from '../helpers.js';

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
