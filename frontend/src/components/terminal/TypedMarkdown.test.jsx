import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TypedMarkdown from './TypedMarkdown';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const tick = (ms) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('TypedMarkdown', () => {
  it('reveals the text one word per tick', () => {
    const { container } = render(<TypedMarkdown text="alpha beta gamma" />);

    tick(0);
    expect(container).toHaveTextContent('alpha');
    expect(container).not.toHaveTextContent('beta');

    tick(135);
    expect(container).toHaveTextContent('alpha beta');
    expect(container).not.toHaveTextContent('gamma');

    tick(135);
    expect(container).toHaveTextContent('alpha beta gamma');
  });

  it('shows the cursor while revealing and hides it when done', () => {
    const { container } = render(<TypedMarkdown text="one two" />);

    tick(0);
    expect(container.querySelector('.terminal-cursor')).not.toBeNull();

    tick(500);
    expect(container.querySelector('.terminal-cursor')).toBeNull();
  });

  it('calls onSettled once, only after the text is final and fully revealed', () => {
    const onSettled = vi.fn();
    const { rerender } = render(<TypedMarkdown text="one two" isFinal={false} onSettled={onSettled} />);

    tick(500);
    expect(onSettled).not.toHaveBeenCalled();

    rerender(<TypedMarkdown text="one two" isFinal onSettled={onSettled} />);
    tick(0);
    expect(onSettled).toHaveBeenCalledTimes(1);

    tick(500);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('renders markdown and converts bracket math delimiters', () => {
    const { container } = render(<TypedMarkdown text="**bold** \(x\)" />);
    tick(1000);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('.katex')).not.toBeNull();
  });
});
