import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

const FRONTEND_DIR = fileURLToPath(new URL('../..', import.meta.url));

function freePort() {
  return new Promise((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// Each test gets its own server.js at production settings: a fresh process
// means a fresh rate-limit window, so repeated runs never see each other's
// requests. The rate-limit overrides are removed from the child's env.
const test = base.extend({
  prodServer: async ({ playwright }, use) => {
    const port = await freePort();
    const env = { ...process.env, PORT: String(port), BACKEND_URL: 'http://127.0.0.1:9' };
    delete env.RUN_RATE_LIMIT;
    delete env.WARMUP_RATE_LIMIT;
    delete env.AGENT_URL;
    const child = spawn('node', ['server.js'], { cwd: FRONTEND_DIR, env });
    await new Promise((resolve, reject) => {
      child.stdout.on('data', (chunk) => {
        if (chunk.toString().includes('Server is running')) resolve();
      });
      child.on('exit', (code) => reject(new Error(`server.js exited with ${code}`)));
    });
    const request = await playwright.request.newContext({ baseURL: `http://127.0.0.1:${port}` });
    await use(request);
    await request.dispose();
    child.kill();
  },
});

test('www host redirects to the apex domain with path and query', async ({ prodServer }) => {
  const response = await prodServer.get('/privacy-policy?x=1', {
    headers: { Host: 'www.frederikheda.com' },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe('https://frederikheda.com/privacy-policy?x=1');
});

test('responses carry the security headers', async ({ prodServer }) => {
  const headers = (await prodServer.get('/')).headers();
  expect(headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-xss-protection']).toBe('1; mode=block');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
});

const CONTENT = JSON.parse(readFileSync(new URL('../../../content/site-content.json', import.meta.url), 'utf8'));
const metaContent = (html, property) => html.match(new RegExp(`<meta property="${property}" content="([^"]*)">`))?.[1];

test('each route gets its own title and link-preview tags', async ({ prodServer }) => {
  const home = await (await prodServer.get('/')).text();
  expect(home).toContain(`<title>${CONTENT.profile.name}</title>`);
  expect(metaContent(home, 'og:url')).toBe('https://frederikheda.com');
  expect(home).not.toContain('<!--route-meta-->');

  const about = await prodServer.get('/about');
  expect(about.status()).toBe(200);
  const html = await about.text();
  expect(html).toContain(`<title>About ${CONTENT.profile.name}</title>`);
  expect(metaContent(html, 'og:description')).toBe(CONTENT.profile.claim);

  const project = CONTENT.projects[0];
  const projectHtml = await (await prodServer.get(`/projects/${project.id}`)).text();
  expect(projectHtml).toContain(`<title>${project.title} · ${CONTENT.profile.name}</title>`);
});

test('an unknown page or project answers 404 with the app shell', async ({ prodServer }) => {
  for (const path of ['/projects/nope', '/nope']) {
    const response = await prodServer.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('<div id="root"></div>');
  }
});

test('warmup allows ten calls a minute', async ({ prodServer }) => {
  for (let i = 0; i < 10; i++) {
    expect((await prodServer.get('/api/warmup')).status()).toBe(204);
  }
  expect((await prodServer.get('/api/warmup')).status()).toBe(429);
});

test('chat runs allow five a minute', async ({ prodServer }) => {
  const run = () => prodServer.post('/api/copilotkit/agent/portfolio_agent/run', { data: {} });
  for (let i = 0; i < 5; i++) {
    expect((await run()).status()).not.toBe(429);
  }
  expect((await run()).status()).toBe(429);
});
