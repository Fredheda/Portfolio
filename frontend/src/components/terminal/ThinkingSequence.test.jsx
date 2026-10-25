import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThinkingSequence from './ThinkingSequence';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const advance = (ms) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('ThinkingSequence', () => {
  it('plays the intro, ends with the tail lines, and calls onDone once', async () => {
    const onDone = vi.fn();
    render(<ThinkingSequence onDone={onDone} />);

    // After onDone the log keeps appending batches and eventually rolls the
    // tail lines off the front, so step until onDone fires and stop there.
    for (let elapsed = 0; onDone.mock.calls.length === 0 && elapsed < 30_000; elapsed += 100) {
      await advance(100);
    }

    expect(screen.getByText('IDENTITY CONFIRMED: visitor')).toBeInTheDocument();
    expect(screen.getByText('RESPONSE READY')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('prints lines progressively, not all at once', async () => {
    const { container } = render(<ThinkingSequence onDone={() => {}} />);

    await advance(0);
    const first = container.querySelectorAll('div > div').length;
    await advance(10_000);
    const later = container.querySelectorAll('div > div').length;

    expect(first).toBeGreaterThanOrEqual(1);
    expect(later).toBeGreaterThan(first);
  });

  it('in loop mode skips the tail lines and never calls onDone', async () => {
    const onDone = vi.fn();
    render(<ThinkingSequence loop onDone={onDone} />);

    await advance(60_000);

    expect(screen.queryByText('IDENTITY CONFIRMED: visitor')).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('stops after unmount', async () => {
    const onDone = vi.fn();
    const { unmount } = render(<ThinkingSequence onDone={onDone} />);

    unmount();
    await advance(60_000);

    expect(onDone).not.toHaveBeenCalled();
  });
});
