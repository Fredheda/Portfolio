import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentHead } from './useDocumentHead';

describe('useDocumentHead', () => {
  it('sets the title and restores the previous one on unmount', () => {
    document.title = 'Before';
    const { unmount } = renderHook(() => useDocumentHead({ title: 'After' }));
    expect(document.title).toBe('After');
    unmount();
    expect(document.title).toBe('Before');
  });

  it('keeps the title when none is given', () => {
    document.title = 'Kept';
    renderHook(() => useDocumentHead({ title: undefined }));
    expect(document.title).toBe('Kept');
  });

  it('adds a noindex robots tag only while mounted', () => {
    const { unmount } = renderHook(() => useDocumentHead({ title: 'Page', noindex: true }));
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
