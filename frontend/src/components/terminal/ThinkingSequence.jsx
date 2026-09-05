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
    { text: 'LOADING: embeddings.vec', category: 'io', type: 'bar' },
    { text: 'LOADING: knowledge_base.idx', category: 'io', type: 'bar' },
    { text: 'DOWNLOADING: context_cache.bin', category: 'io', type: 'bar' },
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

// Odds that a stage with bar-type lines actually shows one in a given pass.
// Previously guaranteed (100%) per stage per pass -- with RETRIEVAL the only
// stage that has any, that meant a progress bar on every single pass, which
// reads as too frequent over a long wait (the loop rebuilds a pass every few
// seconds). Below 1 makes it an occasional beat instead of a fixture.
const BAR_LINE_CHANCE = 0.1;

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

// Loop mode caps how many lines it keeps around -- old ones roll off the
// front once this is hit, same as a real terminal's scrollback eventually
// dropping earliest lines, rather than the pane ever wiping and restarting.
const MAX_RETAINED_LINES = 40;

function buildSequence(withTail = true) {
  const MIN_PER_STAGE = 2;
  const MAX_PER_STAGE = 4;
  const picked = STAGE_ORDER.flatMap((stage) => {
    const pool = STAGES[stage];
    const regularPool = pool.filter((line) => line.type !== 'bar');
    const barLines = pool.filter((line) => line.type === 'bar');

    const shuffled = [...regularPool].sort(() => Math.random() - 0.5);
    const count = MIN_PER_STAGE + Math.floor(Math.random() * (MAX_PER_STAGE - MIN_PER_STAGE + 1));
    const selected = shuffled.slice(0, Math.min(count, regularPool.length));

    // A stage with bar lines only shows one sometimes (see BAR_LINE_CHANCE)
    // -- picked randomly from that stage's options when it does.
    if (barLines.length > 0 && Math.random() < BAR_LINE_CHANCE) {
      selected.push(barLines[Math.floor(Math.random() * barLines.length)]);
    }
    // Re-shuffle so the bar line lands at a random position within the
    // stage, rather than always playing last.
    selected.sort(() => Math.random() - 0.5);

    return selected.map((line) => ({
      text: line.text,
      className: CATEGORY_CLASSNAMES[line.category] ?? CATEGORY_CLASSNAMES.default,
      holdMs: line.type === 'bar' ? [1200, 1500] : (line.holdMs ?? DEFAULT_HOLD_MS),
      type: line.type ?? 'text',
    }));
  });
  return withTail ? [...picked, IDENTITY_LINE, FINAL_LINE] : picked;
}

// `loop` only controls what the FIRST pass looks like: `false` plays the
// themed intro (with the IDENTITY CONFIRMED/RESPONSE READY tail and a longer
// hold before `onDone` fires), `true` skips straight to a plain batch. Either
// way, once that first pass finishes, the component always keeps
// regenerating and appending fresh batches for as long as it stays mounted
// (capped at MAX_RETAINED_LINES, oldest dropped first) rather than replacing
// the whole log -- so it reads as one continuously scrolling terminal
// instead of visibly clearing and restarting every pass. Critically, the
// same instance keeps running across the intro -> "still waiting" handoff
// too: a parent that plays the intro (`loop={false}`) and wants to keep
// showing this while a real reply is still pending must keep this same
// element mounted rather than swapping in a second, freshly-mounted
// instance once `onDone` fires -- mounting a second one reintroduces the
// exact "wipe and restart" look this was built to avoid, just moved to that
// handoff instead of happening within a single instance. The parent decides
// when to actually stop it by unmounting once real content arrives.
export default function ThinkingSequence({ onDone, loop = false, scrollContainerRef }) {
  const [lines, setLines] = useState(() => buildSequence(!loop));
  const [visibleCount, setVisibleCount] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    // Mutable locals mirroring the rendered state -- the loop below needs
    // the up-to-date line list/count between passes without waiting on a
    // render, and this effect only ever runs once per `loop` value.
    let currentLines = lines;
    let currentVisible = 0;

    async function revealFrom(sequence, fromIndex, toIndex) {
      for (let i = fromIndex; i < toIndex; i++) {
        if (cancelled) return;
        currentVisible = i + 1;
        setVisibleCount(currentVisible);
        const [minMs, maxMs] = sequence[i].holdMs;
        const delay = minMs + Math.random() * (maxMs - minMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    async function run() {
      await revealFrom(currentLines, 0, currentLines.length);
      if (cancelled) return;

      if (!loop) {
        const holdMs = MIN_HOLD_MS + Math.random() * (MAX_HOLD_MS - MIN_HOLD_MS);
        await new Promise((resolve) => setTimeout(resolve, holdMs));
        if (cancelled) return;
        onDoneRef.current();
        // Deliberately no `return` here: if the parent keeps this instance
        // mounted past the intro (the real reply still isn't ready), it
        // should fall straight into the same continuous-append loop below
        // instead of stopping -- otherwise the parent's only option is to
        // mount a *second*, fresh ThinkingSequence for the ongoing wait,
        // which is exactly the visible "wipe and restart" this was meant to
        // fix, just moved to the intro/wait handoff instead of within it.
      }

      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const nextBatch = buildSequence(false);
        const appendAt = currentLines.length;
        let combined = [...currentLines, ...nextBatch];
        let revealFromIndex = appendAt;

        if (combined.length > MAX_RETAINED_LINES) {
          const overflow = combined.length - MAX_RETAINED_LINES;
          combined = combined.slice(overflow);
          revealFromIndex = appendAt - overflow;
          currentVisible = Math.max(0, currentVisible - overflow);
          setVisibleCount(currentVisible);
        }

        currentLines = combined;
        setLines(combined);
        await revealFrom(combined, revealFromIndex, combined.length);
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  // Keep the growing log in view the same way TypedMarkdown follows the real
  // reply -- only auto-follow while already scrolled near the bottom, so it
  // doesn't fight a manual scroll-up.
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= 64) {
      container.scrollTo({ top: container.scrollHeight });
    }
  }, [visibleCount, scrollContainerRef]);

  return (
    <div className="py-1 font-mono text-xs leading-relaxed max-w-md" aria-live="polite">
      {lines.slice(0, visibleCount).map((line, index) =>
        line.type === 'bar' ? (
          <div key={index} className={`flex items-center gap-2 ${line.className}`}>
            <span>{line.text}</span>
            <span className="text-zinc-600">[</span>
            <span className="relative inline-block w-24 h-2 bg-zinc-800 rounded-sm overflow-hidden align-middle">
              <span className="absolute inset-y-0 left-0 bg-accent-cyan terminal-bar-fill" />
            </span>
            <span className="text-zinc-600">]</span>
          </div>
        ) : (
          <div key={index} className={line.className}>{line.text}</div>
        )
      )}
    </div>
  );
}
