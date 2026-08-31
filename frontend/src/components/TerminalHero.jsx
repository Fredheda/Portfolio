import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { normalizeMathDelimiters } from '../lib/markdown';
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2';
import { useChatThread } from '../context/ChatThreadContext';
import ThinkingSequence from './terminal/ThinkingSequence';
import TypedMarkdown from './terminal/TypedMarkdown';

const BOOT_DELAY_MS = 900;

const TerminalHero = () => {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const { resetThread } = useChatThread();

  const [input, setInput] = useState('');
  const [booted, setBooted] = useState(false);
  const [sequenceActive, setSequenceActive] = useState(false);
  // True from the first message's send until its real reply starts
  // arriving -- spans both the intro theater AND whatever escalating wait
  // follows it, so the SAME ThinkingSequence instance stays mounted for the
  // whole stretch instead of being swapped for a second, freshly-mounted
  // one once the intro's own first pass ends (see ThinkingSequence's own
  // comment on why that handoff would look like a reset even though a
  // single instance never resets itself).
  const [introWaitActive, setIntroWaitActive] = useState(false);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [replySettled, setReplySettled] = useState(true);
  // Escalating "still working" indicator for messages after the first one
  // (which already gets the full intro theater from send onward): the
  // fredbot glyph shows instantly, then "thinking ..." after 1s, then the
  // fake process log (looping, since the real wait time is unknown) after
  // 3s -- covers slow real replies, e.g. an MCP tool call.
  const [waitStage, setWaitStage] = useState('none'); // 'none' | 'thinking' | 'sequence'
  const waitTimersRef = useRef([]);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  const messages = (agent?.messages ?? []).filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0
  );
  const lastMessage = messages[messages.length - 1];
  const pendingAssistantContentStarted = lastMessage?.role === 'assistant';
  const isLoading = agent?.isRunning ?? false;
  // Input stays hidden for the whole exchange -- the fake sequence's own
  // fixed duration, then however long the real response takes to arrive
  // AND finish revealing at its throttled typing pace.
  const busy = sequenceActive || isLoading || !replySettled;

  const clearWaitTimers = () => {
    waitTimersRef.current.forEach(clearTimeout);
    waitTimersRef.current = [];
  };

  // The moment real content starts arriving for the in-flight reply, the
  // escalating indicator above has done its job -- stop it immediately
  // rather than waiting for its own timers to unwind. Also drops
  // `introWaitActive`, which unmounts the intro/wait ThinkingSequence (see
  // its own declaration above) now that the real reply has something to show.
  useEffect(() => {
    if (pendingAssistantContentStarted) {
      if (waitStage !== 'none') {
        clearWaitTimers();
        setWaitStage('none');
      }
      setIntroWaitActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAssistantContentStarted]);

  // Idle cursor-blink boot beat before the terminal "wakes up".
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), BOOT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Fire-and-forget warm-up ping as soon as the hero mounts. The backend
  // container app scales to zero, and its FastAPI lifespan hook builds the
  // LangGraph agent -- which loads MCP tools from the (also scale-to-zero)
  // mcp-tools Function App -- before it can serve even `/health`. Pinging
  // here means that whole cold-start chain runs while the visitor is
  // reading the intro line / typing their first message, instead of only
  // starting once they hit enter.
  useEffect(() => {
    fetch('/api/warmup').catch(() => {});
  }, []);

  // Jump to bottom only on a genuinely new turn (message count changing --
  // the user's own message, or the assistant's first token appearing) or a
  // sequence transition. Deliberately NOT keyed on raw content length: that
  // changes on every backend token delta for the whole real streaming
  // duration, which would force-scroll on every one of those regardless of
  // a manual scroll-up -- `TypedMarkdown` already handles following the
  // reply as it (throttled-)reveals, and only while already near the
  // bottom, which respects a manual scroll instead of fighting it.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sequenceActive]);

  // The prompt line is inline with the scrollback, not a separate widget --
  // keep it focused whenever it's actually typeable, like a real terminal.
  useEffect(() => {
    if (booted && !busy) inputRef.current?.focus();
  }, [booted, busy]);

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !agent || busy) return;

    const sanitizedInput = DOMPurify.sanitize(trimmed);
    setInput('');
    setReplySettled(false);
    // The user's own message renders immediately via the normal message
    // list below -- only the assistant's reply is held back (by the
    // `sequenceActive` check in the render) until the fake sequence ends.
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: sanitizedInput });

    // The "machine surveillance log" intro theater plays once, on the first
    // message of a session -- it establishes the vibe; replaying it on
    // every message would slow down a conversation already under way.
    if (!hasSentFirstMessage) {
      setHasSentFirstMessage(true);
      setSequenceActive(true);
      setIntroWaitActive(true);
    }

    // Escalating "still working" indicator, armed on every send: the
    // fredbot glyph shows instantly (pending-row render below), "thinking
    // ..." at 1s, a looping fake log at 3s if a real reply (e.g. one
    // waiting on an MCP tool call) is genuinely still in flight. For the
    // first message the pending row only becomes visible once the intro
    // above finishes -- but these timers start now regardless, so if the
    // intro's own ~0.5-1.3s already ran most of the clock, the indicator
    // picks up from the real elapsed time instead of resetting to zero.
    clearWaitTimers();
    setWaitStage('none');
    waitTimersRef.current = [
      setTimeout(() => setWaitStage((stage) => (stage === 'none' ? 'thinking' : stage)), 1000),
      setTimeout(() => setWaitStage((stage) => (stage !== 'sequence' ? 'sequence' : stage)), 3000),
    ];

    await copilotkit.runAgent({ agent });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleSendMessage();
  };

  const clearChat = () => {
    agent?.setMessages([]);
    resetThread();
    // A cleared thread is a new session -- the intro sequence should play
    // again on its first message.
    setHasSentFirstMessage(false);
    setReplySettled(true);
    clearWaitTimers();
    setWaitStage('none');
    setSequenceActive(false);
    setIntroWaitActive(false);
  };

  const handleSequenceDone = () => setSequenceActive(false);

  return (
    <section className="relative max-w-[1200px] mx-auto mb-12 px-2">
      <div className="relative bg-[#050505] rounded-lg overflow-hidden border border-zinc-900">
        <div className="terminal-scanlines" />
        <div className="terminal-vignette" />

        <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-zinc-900">
          <span className="font-mono text-[11px] text-zinc-600">fredbot.sh</span>
          <button
            onClick={clearChat}
            className="font-mono text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            clear
          </button>
        </div>

        <div
          ref={logRef}
          onClick={() => inputRef.current?.focus()}
          data-lenis-prevent
          className="relative px-5 py-5 h-[420px] overflow-y-auto font-mono text-[13px] leading-relaxed cursor-text"
        >
          {!booted ? (
            <span className="terminal-cursor" />
          ) : (
            <>
              <div className="text-zinc-600 mb-4">
                frederik@heda ~ % <span className="text-zinc-300">whoami</span> &&{' '}
                <span className="text-zinc-300">echo</span>{' '}
                <span className="text-zinc-100">
                  "senior ai engineer — ask a question, or try: show me your ml projects"
                </span>
              </div>

              {messages.map((message) => {
                // Assistant reply stays hidden until the fake sequence
                // finishes; once revealed it renders live as it streams in,
                // since this reads straight from agent.messages each render.
                if (message.role === 'assistant' && sequenceActive) return null;
                const contentClassName = `min-w-0 flex-1 ${message.role === 'user' ? 'text-[#ff9a3c] terminal-glow-user' : 'text-zinc-100 terminal-glow'}
                  [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2
                  [&_a]:underline [&_code]:bg-white/5 [&_code]:rounded [&_code]:px-1`;
                return (
                  <div key={message.id} className="mb-4 flex items-start gap-2">
                    <span
                      className={`shrink-0 ${message.role === 'user' ? 'text-[#ff9a3c] terminal-glow-user' : 'text-zinc-600'}`}
                    >
                      {message.role === 'user' ? '❯' : 'fredbot ~ %'}
                    </span>
                    {message.role === 'assistant' ? (
                      <TypedMarkdown
                        text={message.content}
                        className={contentClassName}
                        isFinal={!isLoading}
                        onSettled={() => setReplySettled(true)}
                        scrollContainerRef={logRef}
                      />
                    ) : (
                      <div className={contentClassName}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {normalizeMathDelimiters(message.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}

              {introWaitActive && (
                <ThinkingSequence onDone={handleSequenceDone} scrollContainerRef={logRef} />
              )}

              {!introWaitActive && busy && !pendingAssistantContentStarted && (
                <div className="mb-4 flex items-start gap-2">
                  <span className="shrink-0 text-zinc-600">fredbot ~ %</span>
                  <div className="min-w-0 flex-1">
                    {waitStage === 'thinking' && (
                      <div className="py-1 font-mono text-xs leading-relaxed text-zinc-500">thinking ...</div>
                    )}
                    {waitStage === 'sequence' && (
                      <ThinkingSequence loop scrollContainerRef={logRef} />
                    )}
                  </div>
                </div>
              )}

              {!busy && (
                <div className="flex items-center gap-2">
                  <span className="text-[#ff9a3c] terminal-glow-user shrink-0">❯</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ask me anything..."
                    className="flex-1 min-w-0 bg-transparent font-mono text-[13px] text-[#ff9a3c] terminal-glow-user placeholder-zinc-700 placeholder:[text-shadow:none] outline-none caret-[#ff9a3c]"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;
