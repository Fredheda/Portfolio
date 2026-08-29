import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Reveals text a word at a time instead of snapping straight to whatever the
// backend just delivered -- makes even a fast or non-streaming response
// read as a steady terminal printout instead of popping in all at once.
// `text` may keep growing (real streaming) or arrive all at once; either
// way this only ever chases toward the current word count at its own pace.
const WORDS_PER_TICK = 1;
const TICK_MS = 135;
// Only auto-follow the reply while the log is already scrolled near the
// bottom -- otherwise every tick of a long reply yanks a manually-scrolled
// user straight back down.
const NEAR_BOTTOM_PX = 64;

// Each token is a word plus whatever whitespace follows it, so joining a
// prefix of tokens reconstructs valid text (including newlines/paragraphs)
// rather than losing spacing between words.
function tokenizeWords(text) {
  return text.match(/\S+\s*/g) ?? [];
}

export default function TypedMarkdown({ text, className, isFinal, onSettled, scrollContainerRef }) {
  const [revealed, setRevealed] = useState(0);
  const tokens = useMemo(() => tokenizeWords(text), [text]);
  const targetRef = useRef(tokens.length);
  const settledFiredRef = useRef(false);

  useEffect(() => { targetRef.current = tokens.length; }, [tokens.length]);

  useEffect(() => {
    let cancelled = false;
    let timer;

    function tick() {
      if (cancelled) return;
      setRevealed((current) => {
        if (current >= targetRef.current) return current;
        return Math.min(targetRef.current, current + WORDS_PER_TICK);
      });
      timer = setTimeout(tick, TICK_MS);
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the growing reply in view, but only while the log was already
  // scrolled near the bottom -- respects a manual scroll-up instead of
  // fighting it on every tick. Runs after each reveal actually commits, so
  // scrollHeight/scrollTop reflect the up-to-date DOM.
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= NEAR_BOTTOM_PX) {
      container.scrollTo({ top: container.scrollHeight });
    }
  }, [revealed, scrollContainerRef]);

  // Fires once, the moment this message has both stopped growing (isFinal)
  // and finished revealing everything it currently has -- signals the
  // parent it's safe to accept the next message.
  useEffect(() => {
    if (isFinal && revealed >= tokens.length && !settledFiredRef.current) {
      settledFiredRef.current = true;
      onSettled?.();
    }
  }, [isFinal, revealed, tokens.length, onSettled]);

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{tokens.slice(0, revealed).join('')}</ReactMarkdown>
      {revealed < tokens.length && <span className="terminal-cursor" />}
    </div>
  );
}
