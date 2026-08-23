import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { LangGraphHttpAgent } from '@copilotkit/runtime/langgraph';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';

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

// Multi-route mode (the default): exposes POST /api/copilotkit/agent/:agentId/run
// and friends. Dedicated Express adapter, not a hand-rolled Fetch bridge.
app.use(createCopilotExpressHandler({ runtime, basePath: '/api/copilotkit' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: serve index.html for all routes (React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
