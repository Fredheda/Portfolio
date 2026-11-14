import { expect, test } from '@playwright/test';
import { failBlog, resetBlog } from '../helpers.js';
import { blogImages, blogMath, blogStringToken, robotsMeta } from '../selectors.js';

test.beforeEach(async ({ request }) => {
  await resetBlog(request);
});

test('the list opens a post', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
  await expect(page.getByText('A first post.')).toBeVisible();
  await expect(page.getByText('4 min read')).toBeVisible();
  await page.getByRole('link', { name: 'Hello world' }).click();
  await expect(page).toHaveURL(/\/blog\/hello-world$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Hello world' })).toBeVisible();
});

test('a post shows its formula as MathML and requests no maths font', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/blog/hello-world');
  await expect(blogMath(page).first()).toBeVisible();
  expect((await blogMath(page).first().boundingBox()).width).toBeGreaterThan(0);
  expect(requests.filter((url) => url.includes('KaTeX_'))).toEqual([]);
});

test('a post highlights its code', async ({ page }) => {
  await page.goto('/blog/hello-world');
  await expect(blogStringToken(page).first()).toHaveText("'hi'");
});

test('a post loads its image through the site route and never shows a storage URL', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/blog/hello-world');
  await expect(blogImages(page).first()).toHaveAttribute('src', '/api/blog/posts/hello-world/media/m1');
  await expect(blogImages(page).first()).toHaveAttribute('alt', 'A pixel');
  expect(requests.filter((url) => url.includes('blog-blob'))).toEqual([]);
});

test('an unknown post is a not-found page the search engines skip', async ({ page }) => {
  await page.goto('/blog/missing');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(robotsMeta(page)).toHaveAttribute('content', 'noindex');
});

test('an outage shows fixed text and a retry that works', async ({ page, request }) => {
  await failBlog(request, 1);
  await page.goto('/blog/never-cached');
  await expect(page.getByRole('alert')).toHaveText(/can.t be loaded right now/);
  await expect(page.getByText('SECRET-UPSTREAM')).toHaveCount(0);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('a post does not scroll sideways', async ({ page }) => {
    await page.goto('/blog/hello-world');
    await expect(page.getByRole('heading', { level: 1, name: 'Hello world' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
