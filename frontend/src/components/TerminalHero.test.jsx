import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatThreadProvider } from '../context/ChatThreadContext';
import TerminalHero from './TerminalHero';

const copilot = vi.hoisted(() => ({
  agent: { messages: [], isRunning: false, addMessage: vi.fn(), setMessages: vi.fn() },
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

const renderHero = () =>
  render(
    <ChatThreadProvider resetThread={resetThread}>
      <TerminalHero />
    </ChatThreadProvider>,
  );

const bootTerminal = () =>
  act(() => {
    vi.advanceTimersByTime(900);
  });

beforeEach(() => {
  vi.useFakeTimers();
  copilot.agent.messages = [];
  copilot.agent.isRunning = false;
  copilot.agent.addMessage.mockReset();
  copilot.agent.setMessages.mockReset();
  copilot.runAgent.mockReset().mockResolvedValue(undefined);
  resetThread.mockReset();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('TerminalHero', () => {
  it('pings the warm-up endpoint on mount', () => {
    renderHero();
    expect(fetch).toHaveBeenCalledWith('/api/warmup');
  });

  it('shows the prompt only after the boot delay', () => {
    renderHero();
    expect(screen.queryByPlaceholderText('ask me anything...')).not.toBeInTheDocument();

    bootTerminal();

    expect(screen.getByPlaceholderText('ask me anything...')).toBeInTheDocument();
    expect(screen.getByText('fredbot.sh')).toBeInTheDocument();
  });

  it('sends a trimmed message to the agent and runs it', async () => {
    renderHero();
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
    renderHero();
    bootTerminal();
    const input = screen.getByPlaceholderText('ask me anything...');

    fireEvent.change(input, { target: { value: '   ' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(copilot.agent.addMessage).not.toHaveBeenCalled();
    expect(copilot.runAgent).not.toHaveBeenCalled();
  });

  it('renders user and assistant messages from the agent', () => {
    copilot.agent.messages = [
      { id: '1', role: 'user', content: 'hello there' },
      { id: '2', role: 'assistant', content: 'hi back' },
    ];
    renderHero();
    bootTerminal();

    expect(screen.getByText('hello there')).toBeInTheDocument();
    expect(screen.getByText('fredbot ~ %')).toBeInTheDocument();
  });

  it('shows a first reply that arrives before the intro has finished, once the intro ends', async () => {
    const { rerender } = renderHero();
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
    rerender(
      <ChatThreadProvider resetThread={resetThread}>
        <TerminalHero />
      </ChatThreadProvider>,
    );
    // The intro keeps playing: unmounting it now would skip its onDone.
    fireEvent.click(screen.getByRole('button', { name: 'finish intro' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('button', { name: 'finish intro' })).not.toBeInTheDocument();
    expect(screen.getByText('hi back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ask me anything...')).toBeInTheDocument();
  });

  it('clears the conversation and resets the thread', () => {
    renderHero();
    bootTerminal();

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));

    expect(copilot.agent.setMessages).toHaveBeenCalledWith([]);
    expect(resetThread).toHaveBeenCalledTimes(1);
  });
});
