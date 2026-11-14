import { test, expect } from '@playwright/test';

// Header and scrolling on the real production build (PW-50).
const PHONE = { width: 412, height: 839 };
const scrollY = (page) => page.evaluate(() => window.scrollY);

test('scrolling is native: the wheel moves the page at once', async ({ page }) => {
  await page.goto('/');
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 300);
  // Smoothed scrolling reaches 300px over more than a second; native is immediate.
  await expect.poll(() => scrollY(page), { timeout: 400 }).toBe(300);
});

test('clicking the name on a scrolled home page returns to the top', async ({ page }) => {
  await page.goto('/');
  // Web fonts arrive after the load event and reflow the text above the
  // viewport; Chrome's scroll anchoring then moves scrollY off 800 (855 or 740
  // depending on the font metrics). Scroll only once the fonts have settled.
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect.poll(() => scrollY(page)).toBe(800);
  await page.getByRole('link', { name: 'Frederik Heda' }).first().click();
  await expect.poll(() => scrollY(page)).toBe(0);
  expect(new URL(page.url()).pathname).toBe('/');
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('the menu opens as a full panel below the header with clickable links', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const panel = page.getByRole('navigation', { name: 'Mobile' });
    await expect(panel).toBeVisible();

    const header = await page.getByRole('banner').boundingBox();
    const box = await panel.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 8);
    // Fills the screen under the header (not a strip the height of the header).
    expect(box.y + box.height).toBeGreaterThanOrEqual(PHONE.height - 1);
    expect(box.height).toBeGreaterThan(PHONE.height * 0.6);

    for (const name of ['Experience', 'Ask fredbot', 'Projects']) {
      await expect(panel.getByRole('link', { name })).toBeVisible();
    }
  });

  test('a menu link closes the menu and scrolls to its section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Projects' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden();
    await expect.poll(() => scrollY(page)).toBeGreaterThan(500);
    await expect(page.getByRole('heading', { name: 'Projects', level: 2 })).toBeInViewport();
  });
});
