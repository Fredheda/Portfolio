import React from 'react';
import ReactDOM from 'react-dom/client';
import { CopilotKit } from '@copilotkit/react-core/v2';
import './index.css';
// `?raw` returns the file's source as a plain string, bypassing Vite's
// CSS/PostCSS pipeline entirely -- required because this is CopilotKit's
// own pre-built Tailwind output (it contains `@layer base` with no local
// `@tailwind base;` marker of its own), and running the app's Tailwind
// config over it a second time throws. Injected manually as a <style> tag
// below since `?raw` gives text, not an auto-applied stylesheet.
import copilotKitStylesText from '@copilotkit/react-core/v2/styles.css?raw';
import App from './App';
import { AgentUIProvider } from './context/AgentUIContext';

const copilotKitStyleTag = document.createElement('style');
copilotKitStyleTag.textContent = copilotKitStylesText;
document.head.appendChild(copilotKitStyleTag);

const AGENT_ID = 'portfolio_agent';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <AgentUIProvider>
        <App />
      </AgentUIProvider>
    </CopilotKit>
  </React.StrictMode>
);
