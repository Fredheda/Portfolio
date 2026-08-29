import React, { useState } from 'react';
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
import { ChatThreadProvider } from './context/ChatThreadContext';

const copilotKitStyleTag = document.createElement('style');
copilotKitStyleTag.textContent = copilotKitStylesText;
document.head.appendChild(copilotKitStyleTag);

const AGENT_ID = 'portfolio_agent';

// threadId lives here, above <CopilotKit>, and is passed to it directly --
// this is the documented way to let a chat UI switch conversations
// ("Dynamically Switch Threads" in CopilotKit's own docs). Passing threadId
// into a *nested* useAgent() call instead (tried first) doesn't work: it
// requires disambiguating a local hook-instance agentId from the runtime
// agent id, and reassigning it on later renders hit an undocumented
// propagation timing issue -- confirmed live (the clear-chat button
// silently did nothing). ChatThreadProvider exposes resetThread() down to
// TerminalHero.jsx's clear button without prop-drilling through App.jsx.
function Root() {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());

  return (
    <React.StrictMode>
      <ChatThreadProvider resetThread={() => setThreadId(crypto.randomUUID())}>
        <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID} threadId={threadId}>
          <AgentUIProvider>
            <App />
          </AgentUIProvider>
        </CopilotKit>
      </ChatThreadProvider>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
