import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2';
import { useChatThread } from '../context/ChatThreadContext';
import { content } from '../lib/content';
import { normalizeMathDelimiters } from '../lib/markdown';
import { formatSeconds, groupTurns } from '../lib/turns';
import { useToolTimings } from '../lib/useToolTimings';
import Section from './home/Section';
import ThinkingSequence from './terminal/ThinkingSequence';
import TypedMarkdown from './terminal/TypedMarkdown';

const BOOT_DELAY_MS = 900;

const answerClassName =
  'min-w-0 break-words text-[0.95rem] leading-relaxed text-panelText ' +
  '[&_p]:m-0 [&_p+p]:mt-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_a]:text-toolLine [&_a]:underline [&_strong]:text-white [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1';

const FredbotPanel = () => {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const { resetThread } = useChatThread();
  const toolTimings = useToolTimings(agent);

  const [input, setInput] = useState('');
  const [booted, setBooted] = useState(false);
  // The panel sits mid-page: it takes focus only once the visitor has used
  // it, and never scrolls the window to do so.
  const [interacted, setInteracted] = useState(false);
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

  const turns = groupTurns(agent?.messages ?? []);
  const lastTurn = turns[turns.length - 1];
  const pendingAssistantContentStarted = lastTurn?.role === 'assistant';
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
  // rather than waiting for its own timers to unwind.
  useEffect(() => {
    if (pendingAssistantContentStarted && waitStage !== 'none') {
      clearWaitTimers();
      setWaitStage('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAssistantContentStarted]);

  // Once the reply has something to show, drop `introWaitActive`, which
  // unmounts the intro/wait ThinkingSequence -- but only after the intro has
  // played out. Unmounting it mid-intro skips its onDone, so
  // `sequenceActive` would never clear and the reply would stay hidden with
  // no prompt (a fast first reply, or an instant moderation refusal, did
  // exactly that).
  useEffect(() => {
    if (pendingAssistantContentStarted && !sequenceActive) {
      setIntroWaitActive(false);
    }
  }, [pendingAssistantContentStarted, sequenceActive]);

  // A run that fails (the agent sends RUN_ERROR; runAgent itself resolves)
  // sends no reply, so nothing above would ever settle it and the prompt
  // would stay hidden for good. Stop the intro and the wait indicator and
  // give the prompt back.
  useEffect(() => {
    if (!agent) return undefined;
    const { unsubscribe } = agent.subscribe({
      onRunErrorEvent: () => {
        waitTimersRef.current.forEach(clearTimeout);
        waitTimersRef.current = [];
        setWaitStage('none');
        setSequenceActive(false);
        setIntroWaitActive(false);
        setReplySettled(true);
      },
    });
    return unsubscribe;
  }, [agent]);

  // Idle cursor-blink boot beat before the terminal "wakes up".
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), BOOT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Fire-and-forget warm-up ping on mount. The backend container app scales
  // to zero, and its FastAPI lifespan hook builds the LangGraph agent --
  // which loads MCP tools from the (also scale-to-zero) mcp-tools Function
  // App -- before it can serve even `/health`. Pinging here means that whole
  // cold-start chain runs while the visitor reads the page, instead of only
  // starting once they send a message.
  useEffect(() => {
    fetch('/api/warmup').catch(() => {});
  }, []);

  // Jump the log (not the window) to its bottom only on a genuinely new turn
  // or a sequence transition. Not keyed on raw content length: that changes
  // on every token delta and would fight a manual scroll-up; TypedMarkdown
  // follows the reply itself while the log is near the bottom.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns.length, sequenceActive]);

  useEffect(() => {
    if (booted && !busy && interacted) inputRef.current?.focus({ preventScroll: true });
  }, [booted, busy, interacted]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || !agent || busy) return;

    setInteracted(true);
    const sanitizedInput = DOMPurify.sanitize(trimmed);
    setInput('');
    setReplySettled(false);
    // The user's own message renders immediately via the turn list below --
    // only the assistant's reply is held back (by the `sequenceActive` check
    // in the render) until the fake sequence ends.
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: sanitizedInput });

    // The intro theater plays once, on the first message of a session.
    if (!hasSentFirstMessage) {
      setHasSentFirstMessage(true);
      setSequenceActive(true);
      setIntroWaitActive(true);
    }

    // Escalating "still working" indicator, armed on every send: "thinking
    // ..." at 1s, a looping fake log at 3s if a real reply is still in
    // flight. For the first message the pending row only shows once the
    // intro finishes -- but these timers start now regardless, so the
    // indicator picks up from the real elapsed time instead of resetting.
    clearWaitTimers();
    setWaitStage('none');
    waitTimersRef.current = [
      setTimeout(() => setWaitStage((stage) => (stage === 'none' ? 'thinking' : stage)), 1000),
      setTimeout(() => setWaitStage((stage) => (stage !== 'sequence' ? 'sequence' : stage)), 3000),
    ];

    await copilotkit.runAgent({ agent });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') sendMessage(input);
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

  const focusInput = () => {
    setInteracted(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <Section id="fredbot" title="Ask fredbot">
      <p className="-mt-2 mb-6 max-w-[60ch] leading-relaxed text-muted">{content.fredbot.intro}</p>

      <div className="overflow-hidden rounded-2xl bg-panel text-panelText shadow-[0_16px_44px_rgba(15,36,64,0.22)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-xs text-panelMuted">fredbot</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-toolLine">
              <span aria-hidden="true">● </span>connected: mcp tools
            </span>
            <button
              type="button"
              onClick={clearChat}
              className="font-mono text-xs text-panelMuted transition-colors hover:text-panelText"
            >
              clear
            </button>
          </div>
        </div>

        <div
          ref={logRef}
          onClick={focusInput}
          data-lenis-prevent
          className="h-[420px] cursor-text overflow-y-auto px-4 py-4 md:px-5"
        >
          {!booted ? (
            <span className="terminal-cursor" />
          ) : (
            <div className="flex flex-col gap-3">
              {turns.map((turn) => {
                if (turn.role === 'user') {
                  return (
                    <div key={turn.id} className="flex items-start gap-2 font-mono text-[0.8rem] text-panelMuted">
                      <span className="shrink-0 text-prompt" aria-hidden="true">
                        ❯
                      </span>
                      <div className={`${answerClassName} font-mono !text-[0.8rem] !text-panelMuted`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {normalizeMathDelimiters(turn.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                }
                // The reply stays hidden until the intro sequence finishes.
                if (sequenceActive) return null;
                return (
                  <div key={turn.id} className="border-l-2 border-toolLine pl-3">
                    {turn.tools.map((tool) => {
                      const ms = toolTimings.get(tool.id);
                      return (
                        <div key={tool.id} className="mb-1 break-words font-mono text-[0.7rem] text-toolLine">
                          {ms === undefined ? `tool · ${tool.name}` : `tool · ${tool.name} · ${formatSeconds(ms)}`}
                        </div>
                      );
                    })}
                    <TypedMarkdown
                      text={turn.content}
                      className={answerClassName}
                      isFinal={!isLoading}
                      onSettled={() => setReplySettled(true)}
                      scrollContainerRef={logRef}
                    />
                  </div>
                );
              })}

              {introWaitActive && (
                <ThinkingSequence onDone={() => setSequenceActive(false)} scrollContainerRef={logRef} />
              )}

              {!introWaitActive && busy && !pendingAssistantContentStarted && (
                <div className="border-l-2 border-toolLine/40 pl-3">
                  {waitStage === 'thinking' && (
                    <div className="py-1 font-mono text-xs leading-relaxed text-panelMuted">thinking ...</div>
                  )}
                  {waitStage === 'sequence' && <ThinkingSequence loop scrollContainerRef={logRef} />}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {content.fredbot.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      sendMessage(suggestion);
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-panelText transition-colors hover:border-toolLine disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {!busy && (
                <div className="flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-[0.8rem]">
                  <span className="shrink-0 text-prompt" aria-hidden="true">
                    ❯
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    aria-label="Message fredbot"
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ask me anything..."
                    className="min-w-0 flex-1 bg-transparent text-panelText caret-prompt outline-none placeholder:text-panelMuted"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

export default FredbotPanel;
