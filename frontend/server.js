import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { LangGraphHttpAgent } from '@copilotkit/runtime/langgraph';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://ca-portfolio-backend';

// www.frederikheda.com -> frederikheda.com
app.use((req, res, next) => {
  if (req.headers.host === 'www.frederikheda.com') {
    return res.redirect(301, `https://frederikheda.com${req.url}`);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  // Strict-Transport-Security: Force HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options: Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection: Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

const AGENT_URL =
  process.env.AGENT_URL ?? `${BACKEND_URL}/agent/portfolio_agent`;

const runtime = new CopilotRuntime({
  agents: {
    portfolio_agent: new LangGraphHttpAgent({ url: AGENT_URL }),
  },
});

// Same granularity as the retired backend's slowapi limit -- 5 requests per
// minute per IP; each chat turn is one request to this route, so this is
// "5 messages per minute per visitor". Scoped to just the run endpoint
// (POST /api/copilotkit/agent/:agentId/run), not the whole /api/copilotkit
// prefix -- multi-route mode also serves GET /info (fetched once per
// CopilotKit provider mount, i.e. every page load) and GET
// /agent/:agentId/connect under that same prefix, neither of which is a
// chat message; mounting the limiter broadly meant a handful of page
// reloads could exhaust the budget before a single real message was sent
// (confirmed live).
// RUN_RATE_LIMIT and WARMUP_RATE_LIMIT exist only so the browser tests can
// send more than five messages a minute; production sets neither.
const copilotKitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RUN_RATE_LIMIT) || 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
});
app.use('/api/copilotkit/agent/:agentId/run', copilotKitLimiter);

// Warm-up ping: fired by the frontend as soon as the hero mounts, so the
// backend's cold start (scale-to-zero container + its FastAPI lifespan hook
// building the LangGraph agent, which loads MCP tools from the mcp-tools
// Function App) begins before the visitor's first real message instead of
// after it. Fire-and-forget -- the browser gets an immediate response and
// never waits on the backend actually finishing its wake-up. Rate-limited
// generously since it's otherwise a free way to keep the backend
// permanently warm and defeat scale-to-zero.
const warmupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.WARMUP_RATE_LIMIT) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.get('/api/warmup', warmupLimiter, (req, res) => {
  fetch(`${BACKEND_URL}/health`).catch(() => {});
  res.sendStatus(204);
});

// Multi-route mode (the default): exposes POST /api/copilotkit/agent/:agentId/run
// and friends. Dedicated Express adapter, not a hand-rolled Fetch bridge.
app.use(createCopilotExpressHandler({ runtime, basePath: '/api/copilotkit' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback with per-route <title> and link-preview tags. Both files are
// build output (vite.config.mjs writes route-meta.json from the content
// file); the values in route-meta.json are already HTML-escaped. A path not
// in it still gets the app shell, so the app shows its not-found page, but
// with a 404 so crawlers and previews do not treat it as a page.
const indexHtml = readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8');
const routeMeta = JSON.parse(readFileSync(path.join(__dirname, 'dist', 'route-meta.json'), 'utf8'));

app.get('*', (req, res) => {
  const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
  const meta = routeMeta[pathname] ?? routeMeta['/'];
  const html = indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace('<!--route-meta-->', meta.head);
  res.status(routeMeta[pathname] ? 200 : 404).type('html').send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
