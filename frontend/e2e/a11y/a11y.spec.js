import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { terminalInput } from '../selectors.js';

async function seriousViolations(page) {
  // Entrance animations fade content in; mid-fade text measures as low
  // contrast. Scan once every finite animation has finished (looping ones,
  // like the cursor blink, never do).
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity).length,
      ),
    )
    .toBe(0);
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test('the home page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(terminalInput(page)).toBeVisible({ timeout: 30_000 });
  expect(await seriousViolations(page)).toEqual([]);
});

// Opened directly, so this also covers server.js serving the SPA for a deep link.
test('the privacy page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});
