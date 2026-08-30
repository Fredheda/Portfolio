import { createContext, useContext, useState } from 'react';

const AgentUIContext = createContext(null);

export function AgentUIProvider({ children }) {
  const [highlightedProjectIds, setHighlightedProjectIds] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const value = {
    highlightedProjectIds,
    setHighlightedProjectIds,
    expandedProjectId,
    setExpandedProjectId,
  };

  return <AgentUIContext.Provider value={value}>{children}</AgentUIContext.Provider>;
}

export function useAgentUI() {
  const ctx = useContext(AgentUIContext);
  if (!ctx) {
    throw new Error('useAgentUI must be used within an AgentUIProvider');
  }
  return ctx;
}
