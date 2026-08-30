import { useEffect, useRef, useState } from 'react';

// Lines are grouped into stages that always play in this order -- each run
// picks a random subset from each stage (shuffled within the stage) so the
// content varies, but the story stays coherent: authenticate, retrieve,
// infer, respond. This replaces a single flat, globally-shuffled pool.
const STAGE_ORDER = ['AUTH', 'RETRIEVAL', 'INFERENCE', 'RESPONSE'];

const STAGES = {
  AUTH: [
    { text: 'VERIFYING: identity_token', category: 'default' },
    { text: 'HANDSHAKE: TLS 1.3 ... OK', category: 'io' },
    { text: 'OPENING SOCKET: 127.0.0.1:8843', category: 'io' },
    { text: 'DNS RESOLVED: api.internal (4ms)', category: 'io' },
    { text: 'RATE LIMIT CHECK ... PASS', category: 'default' },
    { text: 'SANDBOX: isolation verified', category: 'default' },
    { text: 'AUTH TOKEN SCOPE: read:profile read:projects', category: 'default' },
    { text: 'SESSION KEY DERIVED: hkdf-sha256', category: 'compute' },
    { text: 'CHECKING: origin_header ... OK', category: 'io' },
    { text: 'PING: inference_node ... 12ms', category: 'io' },
    { text: 'LOADING: profile.dat ... OK', category: 'default' },
    { text: 'SIGNATURE VALID: request_payload', category: 'default' },
  ],
  RETRIEVAL: [
    { text: 'CROSS-REFERENCING: knowledge_base.idx', category: 'default' },
    { text: 'PARSING QUERY VECTOR', category: 'compute' },
    { text: 'SCANNING: 14208 RECORDS', category: 'default', holdMs: [500, 900] },
    { text: 'MATCH FOUND: subject_profile', category: 'default' },
    { text: 'INDEXING: project_graph.bin', category: 'default' },
    { text: 'FETCHING: embeddings.vec', category: 'io' },
    { text: 'CHECKSUM: 4f2a9c ... VALID', category: 'default' },
    { text: 'CROSS-REFERENCING: project_index', category: 'default' },
    { text: 'MOUNTING: /var/cache/rag', category: 'io' },
    { text: 'READING: skills_index.json', category: 'io' },
    { text: 'QUERY CLASSIFIED: informational', category: 'default' },
    { text: 'VECTOR SEARCH: k=5 nearest neighbors', category: 'compute', holdMs: [400, 700] },
    { text: 'CACHE: HIT (0.9421)', category: 'default' },
    { text: 'DEDUPING: candidate_answers', category: 'default' },
    { text: 'RANKING: relevance_scores', category: 'compute' },
    { text: 'RESOLVING: context_window', category: 'default' },
  ],
  INFERENCE: [
    { text: 'DECRYPTING: response_cache', category: 'default' },
    { text: 'ALLOCATING: inference_thread [0x7f3a]', category: 'compute' },
    { text: 'SPAWNING: worker_04', category: 'default' },
    { text: 'SPAWNING: worker_11', category: 'default' },
    { text: 'SPAWNING: worker_17', category: 'default' },
    { text: 'MERGING: context_fragments', category: 'compute' },
    { text: 'BUFFERING: response_stream', category: 'io' },
    { text: 'SYNCING: session_state', category: 'io' },
    { text: 'TRACE: request_id 8823-fa', category: 'default' },
    { text: 'ANALYZING SENTIMENT ... NEUTRAL', category: 'compute' },
    { text: 'ROUTING: query_classifier', category: 'default' },
    { text: 'NORMALIZING: token_stream', category: 'default' },
    { text: 'TOKENIZING INPUT ... 214 tokens', category: 'default' },
    { text: 'WEIGHTS LOADED: 7.2GB', category: 'compute', holdMs: [600, 1200] },
    { text: 'GPU UTIL: 94%', category: 'compute' },
    { text: 'THREAD POOL: 8 workers active', category: 'default' },
    { text: 'COMPILING: response_graph.dot', category: 'compute', holdMs: [500, 1000] },
    { text: 'HEAP: 412MB / 2048MB', category: 'default' },
    { text: 'LOCK ACQUIRED: session_mutex', category: 'default' },
    { text: 'LOCK RELEASED: session_mutex', category: 'default' },
    { text: 'FORKING: subprocess_02', category: 'default' },
    { text: 'REAPING: subprocess_02 [exit 0]', category: 'default' },
    { text: 'ENTROPY POOL: 4096 bits', category: 'warn' },
  ],
  RESPONSE: [
    { text: 'WATCHDOG: heartbeat OK', category: 'default' },
    { text: 'WRITING: audit_log.jsonl', category: 'io' },
    { text: 'FLUSHING: stdout buffer', category: 'io' },
    { text: 'SIGNATURE VALID: response_payload', category: 'default' },
    { text: 'SCHEDULING: next_tick', category: 'default' },
    { text: 'FINALIZING: response_object', category: 'default' },
    { text: 'STREAM STATUS: ready', category: 'default' },
  ],
};

// Category -> className. `default` stays the majority (plain dim gray) so
// color reads as a rare accent, not noise, at the fast per-line pace below.
// No real `WARN:`-prefixed cautionary line exists in the pastiche pool, so
// `ENTROPY POOL: 4096 bits` above is tagged `warn` purely as a visual accent
// choice (not a real warning) -- keeps the tone strictly technical while
// still exercising the category.
const CATEGORY_CLASSNAMES = {
  default: 'text-zinc-500',
  io: 'text-cyan-700',
  compute: 'text-violet-700',
  warn: 'text-accent-gold/70',
};

const MIN_DELAY_MS = 40;
const MAX_DELAY_MS = 100;
const DEFAULT_HOLD_MS = [MIN_DELAY_MS, MAX_DELAY_MS];

// Styled identically to the pool lines (same text-zinc-500, no glow) --
// no visual distinction at all from the rest of the fake log, so nothing
// in this sequence is ever mistaken for the real assistant reply.
const IDENTITY_LINE = { text: 'IDENTITY CONFIRMED: visitor', className: 'text-zinc-500', holdMs: DEFAULT_HOLD_MS };
const FINAL_LINE = { text: 'RESPONSE READY', className: 'text-zinc-500', holdMs: DEFAULT_HOLD_MS };

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
    return shuffled.slice(0, Math.min(count, pool.length)).map((line) => ({
      text: line.text,
      className: CATEGORY_CLASSNAMES[line.category] ?? CATEGORY_CLASSNAMES.default,
      holdMs: line.holdMs ?? DEFAULT_HOLD_MS,
    }));
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
        const [minMs, maxMs] = sequence[i - 1].holdMs;
        const delay = minMs + Math.random() * (maxMs - minMs);
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
