import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { resetBackend, sendMessage, waitForPrompt } from '../helpers.js';

const { projects } = JSON.parse(
  readFileSync(new URL('../../../content/site-content.json', import.meta.url), 'utf8'),
);

const PHONE = { width: 360, height: 740 };
const pageWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth);

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: PHONE });

  for (const path of ['/about', `/projects/${projects[0].id}`]) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await pageWidth(page)).toBeLessThanOrEqual(PHONE.width);
    });
  }

  test('the home page does not scroll sideways, even with a tool reply on screen', async ({ page }) => {
    await page.goto('/');
    await sendMessage(page, 'show project details');
    await expect(page.getByText('Done: get_project_details.')).toBeVisible({ timeout: 15_000 });
    expect(await pageWidth(page)).toBeLessThanOrEqual(PHONE.width);
  });
});

test('the fredbot panel boots without scrolling the page', async ({ page }) => {
  await page.goto('/');
  await waitForPrompt(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('a section link in the header works from another page', async ({ page }) => {
  await page.goto('/about');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Experience' }).click();
  await expect(page).toHaveURL(/\/#experience$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Experience' })).toBeInViewport();
});

test('fredbot shows its tool call above the answer', async ({ page }) => {
  await page.goto('/');
  await sendMessage(page, 'show project details');
  const answer = page.getByText('Done: get_project_details.');
  await expect(answer).toBeVisible({ timeout: 15_000 });
  const tool = page.getByText(/^tool · get_project_details/);
  await expect(tool).toBeVisible();
  const [toolBox, answerBox] = [await tool.boundingBox(), await answer.boundingBox()];
  expect(toolBox.y).toBeLessThan(answerBox.y);
});
