import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEventListener } from './useEventListener';

describe('useEventListener', () => {
  it('calls the latest handler for each event on the target', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ handler }) => useEventListener(window, 'resize', handler), {
      initialProps: { handler: first },
    });
    window.dispatchEvent(new Event('resize'));
    rerender({ handler: second });
    window.dispatchEvent(new Event('resize'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener(window, 'resize', handler));
    unmount();
    window.dispatchEvent(new Event('resize'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes the options to addEventListener', () => {
    const add = vi.spyOn(window, 'addEventListener');
    renderHook(() => useEventListener(window, 'scroll', vi.fn(), { passive: true }));
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: undefined, passive: true });
    add.mockRestore();
  });
});
