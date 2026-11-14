import { expect, test } from '@playwright/test';
import { resetBlog } from '../helpers.js';

const LIST = '**/api/blog/posts?limit=1';
const mainNav = (page) => page.getByRole('navigation', { name: 'Main' });

test.beforeEach(async ({ request }) => {
  await resetBlog(request);
});

test('the link shows when the blog has a post, opens the blog and marks the current page', async ({ page }) => {
  await page.goto('/privacy-policy');
  const link = mainNav(page).getByRole('link', { name: 'Blog' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
  await expect(link).toHaveAttribute('aria-current', 'page');
});

for (const [name, fulfil] of [
  ['an empty list', { status: 200, json: { items: [], nextCursor: null } }],
  ['a blog that is switched off (404)', { status: 404, json: { detail: 'Not Found' } }],
  ['an API that is down (503)', { status: 503, json: { error: 'blog_unavailable' } }],
]) {
  test(`no link for ${name}`, async ({ page }) => {
    await page.route(LIST, (route) => route.fulfill(fulfil));
    const answered = page.waitForResponse(LIST);
    await page.goto('/privacy-policy');
    await answered;
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
    await expect(page.getByRole('link', { name: 'Blog' })).toHaveCount(0);
  });
}

test('a list request that never answers does not hold up or break the header', async ({ page }) => {
  await page.route(LIST, () => {}); // never fulfilled, never continued
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/privacy-policy');
  await expect(mainNav(page).getByRole('link', { name: 'Projects' })).toBeVisible();
  await mainNav(page).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.getByRole('link', { name: 'Blog' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the menu lists the Blog link and it opens the blog', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden();
  });
});
