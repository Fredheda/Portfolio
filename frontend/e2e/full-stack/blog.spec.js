import { expect, test } from '@playwright/test';
import { blogCalls, failBlog, resetBlog } from '../helpers.js';

// The backend keeps its blog cache between tests, so each test that counts
// upstream calls uses a request nobody else made (a distinct limit value).
test.beforeEach(async ({ request }) => {
  await resetBlog(request);
});

test('lists posts through the web server with the backend token, not the browser header', async ({ request }) => {
  const response = await request.get('/api/blog/posts?limit=3', {
    headers: { authorization: 'Bearer attacker-token' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.items[0].slug).toBe('hello-world');
  expect(JSON.stringify(body)).not.toContain('futureField');
  const calls = await blogCalls(request);
  expect(calls).toHaveLength(1);
  expect(calls[0].authorized).toBe(true);
});

test('serves a post with its formula and code block unchanged and no storage path', async ({ request }) => {
  const response = await request.get('/api/blog/posts/hello-world');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.body).toContain('$e^{i\\pi}+1=0$');
  expect(body.body).toContain('```python\nprint(');
  expect(JSON.stringify(body)).not.toContain('blobPath');
});

test('a repeat list call within the cache window does not call the read API again', async ({ request }) => {
  await request.get('/api/blog/posts?limit=4');
  await request.get('/api/blog/posts?limit=4');
  expect(await blogCalls(request)).toHaveLength(1);
});

test('streams media through the proxy with range support and never shows the blob URL', async ({ request }) => {
  const full = await request.get('/api/blog/posts/hello-world/media/m1');
  expect(full.status()).toBe(200);
  expect(full.headers()['content-type']).toContain('image/png');
  expect(full.headers()['x-content-type-options']).toBe('nosniff');
  expect(full.headers()['content-security-policy']).toContain('sandbox');
  expect(JSON.stringify(full.headers())).not.toContain('blog-blob');
  expect((await full.body()).length).toBe(64);

  const part = await request.get('/api/blog/posts/hello-world/media/m1', {
    headers: { range: 'bytes=0-9' },
  });
  expect(part.status()).toBe(206);
  expect(part.headers()['content-range']).toBe('bytes 0-9/64');
  expect((await part.body()).length).toBe(10);
});

test('unknown post is a 404 and an outage is a fixed 503', async ({ request }) => {
  const missing = await request.get('/api/blog/posts/missing');
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ error: 'not_found' });

  await failBlog(request, 1); // a 500 is not retried: one failure is enough
  const down = await request.get('/api/blog/posts/never-cached');
  expect(down.status()).toBe(503);
  expect(await down.json()).toEqual({ error: 'blog_unavailable' });
});

test('only GET is accepted', async ({ request }) => {
  const response = await request.post('/api/blog/posts');
  expect(response.status()).toBe(405);
});
