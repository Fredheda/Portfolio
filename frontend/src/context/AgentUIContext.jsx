import { createContext, useContext, useState } from 'react';

const AgentUIContext = createContext(null);

export function AgentUIProvider({ children }) {
  const [highlightedProjectIds, setHighlightedProjectIds] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [chartSpec, setChartSpec] = useState(null);

  const value = {
    highlightedProjectIds,
    setHighlightedProjectIds,
    expandedProjectId,
    setExpandedProjectId,
    chartSpec,
    setChartSpec,
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
