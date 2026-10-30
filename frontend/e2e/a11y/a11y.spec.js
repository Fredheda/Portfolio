import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { terminalInput } from '../selectors.js';

// Violations the site had when this gate was added. They are switched off
// by rule id so the gate starts green and catches anything new; each one is
// listed in the PR that added it, for the owner to fix or accept:
// - color-contrast: zinc-500/600 text on the dark background (both pages).
// - link-in-text-block: privacy-page links told apart by colour only.
// - link-name: the email, LinkedIn and GitHub icon links have no text.
const KNOWN_RULES = ['color-contrast', 'link-in-text-block', 'link-name'];

async function seriousViolations(page) {
  const { violations } = await new AxeBuilder({ page }).disableRules(KNOWN_RULES).analyze();
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
