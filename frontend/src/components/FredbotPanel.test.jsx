import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatThreadProvider } from '../context/ChatThreadContext';
import { content } from '../lib/content';
import FredbotPanel from './FredbotPanel';

// Recovery from a failed run (the agent subscription) is covered by the
// browser suite's model-failure test, which fails the real stack.
const copilot = vi.hoisted(() => ({
  agent: {
    messages: [],
    isRunning: false,
    addMessage: vi.fn(),
    setMessages: vi.fn(),
    subscribe: vi.fn(),
  },
  subscribers: [],
  runAgent: vi.fn(),
}));

vi.mock('@copilotkit/react-core/v2', () => ({
  useAgent: () => ({ agent: copilot.agent }),
  useCopilotKit: () => ({ copilotkit: { runAgent: copilot.runAgent } }),
}));
// The animated fake log is covered by its own test; stub it here. The stub's
// button stands in for the intro finishing (ThinkingSequence calls onDone).
vi.mock('./terminal/ThinkingSequence', () => ({
  default: ({ onDone }) => (
    <div>
      [thinking sequence]
      {onDone && <button onClick={onDone}>finish intro</button>}
    </div>
  ),
}));

const resetThread = vi.fn();

const panel = () => (
  <ChatThreadProvider resetThread={resetThread}>
    <FredbotPanel />
  </ChatThreadProvider>
);

const renderPanel = () => render(panel());

const bootTerminal = () =>
  act(() => {
    vi.advanceTimersByTime(900);
  });

// Every subscriber the panel registered (run errors, tool timings).
const emit = (handler, event) =>
  act(() => {
    copilot.subscribers.forEach((s) => s[handler]?.({ event }));
  });

const toolCall = (id, name) => ({ id, type: 'function', function: { name, arguments: '{}' } });

beforeEach(() => {
  vi.useFakeTimers();
  copilot.agent.messages = [];
  copilot.agent.isRunning = false;
  copilot.agent.addMessage.mockReset();
  copilot.agent.setMessages.mockReset();
  copilot.subscribers = [];
  copilot.agent.subscribe.mockReset().mockImplementation((subscriber) => {
    copilot.subscribers.push(subscriber);
    return { unsubscribe: () => {} };
  });
  copilot.runAgent.mockReset().mockResolvedValue(undefined);
  resetThread.mockReset();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('FredbotPanel', () => {
  it('pings the warm-up endpoint on mount', () => {
    renderPanel();
    expect(fetch).toHaveBeenCalledWith('/api/warmup');
  });

  it('explains itself, names what it is connected to and anchors the section', () => {
    renderPanel();
    expect(screen.getByRole('region', { name: 'Ask fredbot' })).toHaveAttribute('id', 'fredbot');
    expect(screen.getByText(content.fredbot.intro)).toBeInTheDocument();
    expect(screen.getByText('connected: mcp tools')).toBeInTheDocument();
  });

  it('shows the prompt only after the boot delay, without taking focus', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    renderPanel();
    expect(screen.queryByPlaceholderText('ask me anything...')).not.toBeInTheDocument();

    bootTerminal();

    expect(screen.getByPlaceholderText('ask me anything...')).toBeInTheDocument();
    expect(focus).not.toHaveBeenCalled();
  });

  it('sends a trimmed message to the agent and runs it', async () => {
    renderPanel();
    bootTerminal();
    const input = screen.getByPlaceholderText('ask me anything...');

    fireEvent.change(input, { target: { value: '  show me your ml projects  ' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(copilot.agent.addMessage).toHaveBeenCalledTimes(1);
    expect(copilot.agent.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user', content: 'show me your ml projects' }),
    );
    expect(copilot.runAgent).toHaveBeenCalledWith({ agent: copilot.agent });
  });

  it('ignores an empty message', async () => {
    renderPanel();
    bootTerminal();
    const input = screen.getByPlaceholderText('ask me anything...');

    fireEvent.change(input, { target: { value: '   ' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(copilot.agent.addMessage).not.toHaveBeenCalled();
    expect(copilot.runAgent).not.toHaveBeenCalled();
  });

  it('sends a suggestion when its chip is clicked, then disables the chips while busy', async () => {
    renderPanel();
    bootTerminal();
    const [first] = content.fredbot.suggestions;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: first }));
    });

    expect(copilot.agent.addMessage).toHaveBeenCalledWith(expect.objectContaining({ role: 'user', content: first }));
    expect(copilot.runAgent).toHaveBeenCalledTimes(1);
    for (const text of content.fredbot.suggestions) {
      expect(screen.getByRole('button', { name: text })).toBeDisabled();
    }
  });

  it('shows each tool call above its answer, with the time the browser measured', () => {
    const { rerender } = renderPanel();
    bootTerminal();

    emit('onToolCallStartEvent', { toolCallId: 'c1' });
    act(() => {
      vi.advanceTimersByTime(2140);
    });
    emit('onToolCallResultEvent', { toolCallId: 'c1' });

    copilot.agent.messages = [
      { id: 'u1', role: 'user', content: 'show project details' },
      {
        id: 'a1',
        role: 'assistant',
        content: '',
        toolCalls: [toolCall('c1', 'get_project_details'), toolCall('c2', 'highlightProjects')],
      },
      { id: 't1', role: 'tool', toolCallId: 'c1', content: '{}' },
      { id: 't2', role: 'tool', toolCallId: 'c2', content: 'ok' },
      { id: 'a2', role: 'assistant', content: 'Done: get_project_details.' },
    ];
    rerender(panel());
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const timed = screen.getByText('tool · get_project_details · 2.1 s');
    const untimed = screen.getByText('tool · highlightProjects');
    const answer = screen.getByText('Done: get_project_details.');
    expect(timed.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(untimed.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The browser suite hits this only because its scripted model answers
  // faster than the intro plays; this pins it without relying on that.
  it('shows a first reply that arrives before the intro has finished, once the intro ends', async () => {
    const { rerender } = renderPanel();
    bootTerminal();
    const input = screen.getByPlaceholderText('ask me anything...');
    fireEvent.change(input, { target: { value: 'hello there' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    // The reply streams in while the intro is still playing.
    copilot.agent.messages = [
      { id: '1', role: 'user', content: 'hello there' },
      { id: '2', role: 'assistant', content: 'hi back' },
    ];
    rerender(panel());
    // The intro keeps playing: unmounting it now would skip its onDone.
    fireEvent.click(screen.getByRole('button', { name: 'finish intro' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('button', { name: 'finish intro' })).not.toBeInTheDocument();
    expect(screen.getByText('hi back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ask me anything...')).toBeInTheDocument();
  });
});
