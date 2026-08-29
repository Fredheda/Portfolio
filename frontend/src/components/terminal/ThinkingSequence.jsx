import { useEffect, useRef, useState } from 'react';

// Pool of fake process lines -- a random subset/order is picked per run so
// it never plays identically twice, and the fast tempo below is meant to
// read as "a large program executing lots of processes very quickly"
// rather than a deliberate, evenly-paced readout.
const LINE_POOL = [
  'CROSS-REFERENCING: knowledge_base.idx',
  'LOADING: profile.dat ... OK',
  'PARSING QUERY VECTOR',
  'SCANNING: 14208 RECORDS',
  'MATCH FOUND: subject_profile',
  'DECRYPTING: response_cache',
  'VERIFYING: identity_token',
  'INDEXING: project_graph.bin',
  'RESOLVING: context_window',
  'ALLOCATING: inference_thread [0x7f3a]',
  'QUERY CLASSIFIED: informational',
  'FETCHING: embeddings.vec',
  'CHECKSUM: 4f2a9c ... VALID',
  'SPAWNING: worker_04',
  'SPAWNING: worker_11',
  'SPAWNING: worker_17',
  'MERGING: context_fragments',
  'CROSS-REFERENCING: project_index',
  'BUFFERING: response_stream',
  'SYNCING: session_state',
  'PING: inference_node ... 12ms',
  'CACHE: HIT (0.9421)',
  'TRACE: request_id 8823-fa',
  'ANALYZING SENTIMENT ... NEUTRAL',
  'ROUTING: query_classifier',
  'READING: skills_index.json',
  'NORMALIZING: token_stream',
  'OPENING SOCKET: 127.0.0.1:8843',
  'HANDSHAKE: TLS 1.3 ... OK',
  'MOUNTING: /var/cache/rag',
  'TOKENIZING INPUT ... 214 tokens',
  'WEIGHTS LOADED: 7.2GB',
  'GPU UTIL: 94%',
  'THREAD POOL: 8 workers active',
  'COMPILING: response_graph.dot',
  'DEDUPING: candidate_answers',
  'RANKING: relevance_scores',
  'FLUSHING: stdout buffer',
  'HEAP: 412MB / 2048MB',
  'LOCK ACQUIRED: session_mutex',
  'LOCK RELEASED: session_mutex',
  'WATCHDOG: heartbeat OK',
  'WRITING: audit_log.jsonl',
  'RATE LIMIT CHECK ... PASS',
  'SANDBOX: isolation verified',
  'DNS RESOLVED: api.internal (4ms)',
  'FORKING: subprocess_02',
  'REAPING: subprocess_02 [exit 0]',
  'SIGNATURE VALID: response_payload',
  'ENTROPY POOL: 4096 bits',
  'SCHEDULING: next_tick',
];

// Styled identically to the pool lines (same text-zinc-500, no glow) --
// no visual distinction at all from the rest of the fake log, so nothing
// in this sequence is ever mistaken for the real assistant reply.
const IDENTITY_LINE = { text: 'IDENTITY CONFIRMED: visitor', className: 'text-zinc-500' };
const FINAL_LINE = { text: 'RESPONSE READY', className: 'text-zinc-500' };

const MIN_LINES = 8;
const MAX_LINES = 13;
const MIN_DELAY_MS = 40;
const MAX_DELAY_MS = 100;
// First-message (non-loop) only: how long the final "IDENTITY
// CONFIRMED"/"RESPONSE READY" pair holds on screen before handing off --
// long enough to actually read them, rather than flashing by at the same
// 40-100ms pace as every other line.
const MIN_HOLD_MS = 1000;
const MAX_HOLD_MS = 2000;

function buildSequence(withTail = true) {
  const shuffled = [...LINE_POOL].sort(() => Math.random() - 0.5);
  const count = MIN_LINES + Math.floor(Math.random() * (MAX_LINES - MIN_LINES + 1));
  const picked = shuffled.slice(0, count).map((text) => ({ text, className: 'text-zinc-500' }));
  return withTail ? [...picked, IDENTITY_LINE, FINAL_LINE] : picked;
}

// `loop`: keeps regenerating and replaying fresh sequences indefinitely
// instead of running once and calling `onDone` -- used while waiting out a
// real, variable-length backend call (e.g. an MCP tool call) rather than
// playing a fixed-duration intro. The parent decides when to stop it by
// unmounting the component once real content arrives; no fixed "response
// ready" tail is shown between passes since there's nothing to announce yet.
export default function ThinkingSequence({ onDone, loop = false }) {
  const [lines, setLines] = useState(() => buildSequence(!loop));
  const [visibleCount, setVisibleCount] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    let cancelled = false;

    async function playOnce(sequence) {
      for (let i = 1; i <= sequence.length; i++) {
        if (cancelled) return;
        setVisibleCount(i);
        const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    async function run() {
      await playOnce(lines);
      if (cancelled) return;

      if (!loop) {
        const holdMs = MIN_HOLD_MS + Math.random() * (MAX_HOLD_MS - MIN_HOLD_MS);
        await new Promise((resolve) => setTimeout(resolve, holdMs));
        if (cancelled) return;
        onDoneRef.current();
        return;
      }

      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const next = buildSequence(false);
        setLines(next);
        setVisibleCount(0);
        await playOnce(next);
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  return (
    <div className="py-1 font-mono text-xs leading-relaxed" aria-live="polite">
      {lines.slice(0, visibleCount).map((line, index) => (
        <div key={index} className={line.className}>{line.text}</div>
      ))}
    </div>
  );
}
