import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeout } from './useTimeout';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimeout', () => {
  it('calls the callback once after the delay', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 900));
    vi.advanceTimersByTime(899);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('never fires while the delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));
    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('is cancelled on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 100));
    unmount();
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });
});
