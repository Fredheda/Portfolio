import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { diagramSvg } from '../selectors.js';

const { projects } = JSON.parse(
  readFileSync(new URL('../../../content/site-content.json', import.meta.url), 'utf8'),
);

const PHONE = { width: 360, height: 740 };

// Mermaid runs in the real browser here; jsdom cannot draw it.
for (const { id } of projects.filter((p) => p.caseStudy.architecture)) {
  test(`${id}: "For engineers" draws the architecture diagram`, async ({ page }) => {
    await page.goto(`/projects/${id}`);
    await expect(diagramSvg(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'For engineers' }).click();
    await expect(diagramSvg(page)).toBeVisible({ timeout: 20_000 });
  });
}

// The unit tests cover the toggle's content; this covers what jsdom cannot:
// the choice surviving a real reload, and the opened detail fitting a phone.
test('the "For engineers" choice survives a reload', async ({ page }) => {
  await page.goto('/projects/paper-podcasts');
  const detail = page.getByRole('heading', { level: 2, name: "How it's built" });
  await expect(detail).toBeHidden();
  await page.getByRole('button', { name: 'For engineers' }).click();
  await expect(detail).toBeVisible();
  await page.reload();
  await expect(detail).toBeVisible();
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: PHONE });

  test('the opened engineer detail does not scroll sideways', async ({ page }) => {
    await page.goto('/projects/tfl-mcp-server');
    await page.getByRole('button', { name: 'For engineers' }).click();
    await expect(page.getByRole('heading', { level: 2, name: "How it's built" })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(PHONE.width);
  });
});
