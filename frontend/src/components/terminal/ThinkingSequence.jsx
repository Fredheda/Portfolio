import { useEffect, useRef, useState } from 'react';

// Lines are grouped into stages that always play in this order -- each run
// picks a random subset from each stage (shuffled within the stage) so the
// content varies, but the story stays coherent: authenticate, retrieve,
// infer, respond. This replaces a single flat, globally-shuffled pool.
const STAGE_ORDER = ['AUTH', 'RETRIEVAL', 'INFERENCE', 'RESPONSE'];

const STAGES = {
  AUTH: [
    'VERIFYING: identity_token',
    'HANDSHAKE: TLS 1.3 ... OK',
    'OPENING SOCKET: 127.0.0.1:8843',
    'DNS RESOLVED: api.internal (4ms)',
    'RATE LIMIT CHECK ... PASS',
    'SANDBOX: isolation verified',
    'AUTH TOKEN SCOPE: read:profile read:projects',
    'SESSION KEY DERIVED: hkdf-sha256',
    'CHECKING: origin_header ... OK',
    'PING: inference_node ... 12ms',
    'LOADING: profile.dat ... OK',
    'SIGNATURE VALID: request_payload',
  ],
  RETRIEVAL: [
    'CROSS-REFERENCING: knowledge_base.idx',
    'PARSING QUERY VECTOR',
    'SCANNING: 14208 RECORDS',
    'MATCH FOUND: subject_profile',
    'INDEXING: project_graph.bin',
    'FETCHING: embeddings.vec',
    'CHECKSUM: 4f2a9c ... VALID',
    'CROSS-REFERENCING: project_index',
    'MOUNTING: /var/cache/rag',
    'READING: skills_index.json',
    'QUERY CLASSIFIED: informational',
    'VECTOR SEARCH: k=5 nearest neighbors',
    'CACHE: HIT (0.9421)',
    'DEDUPING: candidate_answers',
    'RANKING: relevance_scores',
    'RESOLVING: context_window',
  ],
  INFERENCE: [
    'DECRYPTING: response_cache',
    'ALLOCATING: inference_thread [0x7f3a]',
    'SPAWNING: worker_04',
    'SPAWNING: worker_11',
    'SPAWNING: worker_17',
    'MERGING: context_fragments',
    'BUFFERING: response_stream',
    'SYNCING: session_state',
    'TRACE: request_id 8823-fa',
    'ANALYZING SENTIMENT ... NEUTRAL',
    'ROUTING: query_classifier',
    'NORMALIZING: token_stream',
    'TOKENIZING INPUT ... 214 tokens',
    'WEIGHTS LOADED: 7.2GB',
    'GPU UTIL: 94%',
    'THREAD POOL: 8 workers active',
    'COMPILING: response_graph.dot',
    'HEAP: 412MB / 2048MB',
    'LOCK ACQUIRED: session_mutex',
    'LOCK RELEASED: session_mutex',
    'FORKING: subprocess_02',
    'REAPING: subprocess_02 [exit 0]',
    'ENTROPY POOL: 4096 bits',
  ],
  RESPONSE: [
    'WATCHDOG: heartbeat OK',
    'WRITING: audit_log.jsonl',
    'FLUSHING: stdout buffer',
    'SIGNATURE VALID: response_payload',
    'SCHEDULING: next_tick',
    'FINALIZING: response_object',
    'STREAM STATUS: ready',
  ],
};

// Styled identically to the pool lines (same text-zinc-500, no glow) --
// no visual distinction at all from the rest of the fake log, so nothing
// in this sequence is ever mistaken for the real assistant reply.
const IDENTITY_LINE = { text: 'IDENTITY CONFIRMED: visitor', className: 'text-zinc-500' };
const FINAL_LINE = { text: 'RESPONSE READY', className: 'text-zinc-500' };

const MIN_DELAY_MS = 40;
const MAX_DELAY_MS = 100;
// First-message (non-loop) only: how long the final "IDENTITY
// CONFIRMED"/"RESPONSE READY" pair holds on screen before handing off --
// long enough to actually read them, rather than flashing by at the same
// 40-100ms pace as every other line.
const MIN_HOLD_MS = 1000;
const MAX_HOLD_MS = 2000;

function buildSequence(withTail = true) {
  const MIN_PER_STAGE = 2;
  const MAX_PER_STAGE = 4;
  const picked = STAGE_ORDER.flatMap((stage) => {
    const pool = STAGES[stage];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = MIN_PER_STAGE + Math.floor(Math.random() * (MAX_PER_STAGE - MIN_PER_STAGE + 1));
    return shuffled.slice(0, Math.min(count, pool.length)).map((text) => ({ text, className: 'text-zinc-500' }));
  });
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
