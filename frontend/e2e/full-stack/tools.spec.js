import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { modelCalls, resetBackend, sendMessage } from '../helpers.js';
import { highlightedCards } from '../selectors.js';

const { projects } = JSON.parse(
  readFileSync(new URL('../../../content/site-content.json', import.meta.url), 'utf8'),
);
const project = (id) => projects.find((p) => p.id === id);

test.beforeEach(async ({ page, request }) => {
  await resetBackend(request);
  await page.goto('/');
});

test("the model gets a project's record through the real MCP tool", async ({ page, request }) => {
  await sendMessage(page, 'show project details');
  await expect(page.getByText('Done: get_project_details.')).toBeVisible({ timeout: 15_000 });

  const calls = await modelCalls(request);
  const result = calls[1].messages.at(-1);
  expect(result.type).toBe('tool');
  expect(result.name).toBe('get_project_details');
  expect(JSON.parse(result.text)).toEqual(project('paper-podcasts'));
});

test('the browser runs highlightProjects and its result reaches the model', async ({ page, request }) => {
  await sendMessage(page, 'highlight my work');

  await expect(highlightedCards(page)).toHaveCount(2);
  await expect(highlightedCards(page)).toContainText([
    project('paper-podcasts').title,
    project('tfl-mcp-server').title,
  ]);
  await expect(page.getByText('Done: highlightProjects.')).toBeVisible({ timeout: 15_000 });

  const last = (await modelCalls(request)).at(-1);
  expect(last.messages.some((m) => m.type === 'tool' && m.text === 'Highlighted: paper-podcasts, tfl-mcp-server.')).toBe(
    true,
  );
});
