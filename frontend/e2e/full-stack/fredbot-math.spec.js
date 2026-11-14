import { expect, test } from '@playwright/test';
import { resetBackend, sendMessage } from '../helpers.js';
import { fredbotMath } from '../selectors.js';

test.beforeEach(async ({ page, request }) => {
  await resetBackend(request);
  await page.goto('/');
});

test('a reply with an inline and a block formula shows both as MathML, and requests no maths font', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await sendMessage(page, 'show me a formula');
  await expect(fredbotMath(page)).toHaveCount(2, { timeout: 15_000 });
  await expect(fredbotMath(page).first()).toBeVisible();
  await expect(fredbotMath(page).nth(1)).toHaveAttribute('display', 'block');
  expect(requests.filter((url) => url.includes('KaTeX_'))).toEqual([]);
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('a block formula does not make the page scroll sideways', async ({ page }) => {
    await sendMessage(page, 'show me a formula');
    await expect(fredbotMath(page)).toHaveCount(2, { timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
