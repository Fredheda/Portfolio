import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from './useInterval';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useInterval', () => {
  it('calls the callback every delay, not at mount', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100));
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('pauses while the delay is null and stops on unmount', () => {
    const callback = vi.fn();
    const { rerender, unmount } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: null },
    });
    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
    rerender({ delay: 100 });
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls the latest callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ callback }) => useInterval(callback, 100), {
      initialProps: { callback: first },
    });
    rerender({ callback: second });
    vi.advanceTimersByTime(100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
