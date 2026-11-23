import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { useInterval } from '../../lib/effects/useInterval';
import { mathRehypePlugins, normalizeMathDelimiters } from '../../lib/markdown';

const WORDS_PER_TICK = 1;
const TICK_MS = 135;
const NEAR_BOTTOM_PX = 64;

// Each token is a word plus whatever whitespace follows it, so joining a
// prefix of tokens reconstructs valid text (including newlines/paragraphs)
// rather than losing spacing between words.
function tokenizeWords(text) {
  return text.match(/\S+\s*/g) ?? [];
}

export default function TypedMarkdown({ text, className, isFinal, onSettled, scrollContainerRef }) {
  const tokens = useMemo(() => tokenizeWords(text), [text]);
  const [revealed, setRevealed] = useState(() => Math.min(tokens.length, WORDS_PER_TICK));
  const settledFiredRef = useRef(false);

  useInterval(() => {
    setRevealed((current) => {
      if (current >= tokens.length) return current;
      return Math.min(tokens.length, current + WORDS_PER_TICK);
    });
  }, TICK_MS);

  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= NEAR_BOTTOM_PX) {
      container.scrollTo({ top: container.scrollHeight });
    }
  }, [revealed, scrollContainerRef]);

  useEffect(() => {
    if (isFinal && revealed >= tokens.length && !settledFiredRef.current) {
      settledFiredRef.current = true;
      onSettled?.();
    }
  }, [isFinal, revealed, tokens.length, onSettled]);

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={mathRehypePlugins}>
        {normalizeMathDelimiters(tokens.slice(0, revealed).join(''))}
      </ReactMarkdown>
      {revealed < tokens.length && <span className="terminal-cursor" />}
    </div>
  );
}
