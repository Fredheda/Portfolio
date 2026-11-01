import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEngineerMode } from './useEngineerMode';

const KEY = 'portfolio.forEngineers';

describe('useEngineerMode', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts off with empty storage', () => {
    const { result } = renderHook(() => useEngineerMode());
    expect(result.current[0]).toBe(false);
  });

  it('starts on when the session already chose it', () => {
    sessionStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useEngineerMode());
    expect(result.current[0]).toBe(true);
  });

  it('writes the choice and removes it again', () => {
    const { result } = renderHook(() => useEngineerMode());
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(sessionStorage.getItem(KEY)).toBe('1');
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('still switches when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useEngineerMode());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });
});
