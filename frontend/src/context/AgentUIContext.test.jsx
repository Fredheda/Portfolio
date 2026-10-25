import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentUIProvider, useAgentUI } from './AgentUIContext';

describe('AgentUIContext', () => {
  it('throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAgentUI())).toThrow(
      'useAgentUI must be used within an AgentUIProvider',
    );
    spy.mockRestore();
  });

  it('starts with nothing highlighted or expanded', () => {
    const { result } = renderHook(() => useAgentUI(), { wrapper: AgentUIProvider });
    expect(result.current.highlightedProjectIds).toEqual([]);
    expect(result.current.expandedProjectId).toBeNull();
  });

  it('updates highlighted and expanded ids', () => {
    const { result } = renderHook(() => useAgentUI(), { wrapper: AgentUIProvider });

    act(() => result.current.setHighlightedProjectIds(['a', 'b']));
    act(() => result.current.setExpandedProjectId('a'));

    expect(result.current.highlightedProjectIds).toEqual(['a', 'b']);
    expect(result.current.expandedProjectId).toBe('a');
  });
});
