import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChatThread } from './ChatThreadContext';

describe('ChatThreadContext', () => {
  it('throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useChatThread())).toThrow(
      'useChatThread must be used within a ChatThreadProvider',
    );
    spy.mockRestore();
  });
});
