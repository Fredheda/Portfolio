import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatThreadProvider, useChatThread } from './ChatThreadContext';

describe('ChatThreadContext', () => {
  it('throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useChatThread())).toThrow(
      'useChatThread must be used within a ChatThreadProvider',
    );
    spy.mockRestore();
  });

  it('exposes resetThread from the provider', () => {
    const resetThread = vi.fn();
    const wrapper = ({ children }) => (
      <ChatThreadProvider resetThread={resetThread}>{children}</ChatThreadProvider>
    );
    const { result } = renderHook(() => useChatThread(), { wrapper });

    result.current.resetThread();

    expect(resetThread).toHaveBeenCalledTimes(1);
  });
});
