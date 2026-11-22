# Spec: no effects in components

Status: draft, awaiting specialist approval
Scope: Portfolio frontend only (`frontend/`). Other repos are out of scope.
Tickets: PW-80 (part 1), PW-81 (part 2)
Plan: `docs/plans/2026-11-22-no-use-effect-part1.md` (part 1 only)

## 0. Decision

Ban React effect hooks everywhere in `frontend/src` except one folder of named hooks, `frontend/src/lib/effects/`. Enforce with core ESLint rules (`no-restricted-imports`, `no-restricted-syntax`). No new dependency. Files that still need an effect in part 1 are listed in a baseline in `frontend/eslint.config.js`. Part 2 empties the baseline.

Why: a component that calls `useEffect` syncs state after render, which causes extra renders, stale values and cleanup bugs. Most calls in this codebase are derived state, event logic or resets that need no effect. The effects that remain are subscriptions, timers and DOM syncs; they belong in named hooks with one test each.

## 1. The 27 current calls

Found with `grep -rn -E "useEffect|useLayoutEffect|useInsertionEffect" frontend/src` (15 files). Class: N = non-effect means, F = named hook in the effects folder, K = kept for part 2 (reason in the last column).

| # | File:line | What it does | Class | Part 1 result |
|---|---|---|---|---|
| 1 | `components/Footer.jsx:9` | window `scroll` listener; shows back-to-top after 600 px | F | `useEventListener` |
| 2 | `components/Diagram.jsx:22` | loads Mermaid, renders svg for source | K third-party widget | kept |
| 3 | `components/PrivacyPolicy.jsx:4` | scroll to top on mount | N | ref callback, `useScrollToTopRef` |
| 4 | `components/Headers.jsx:30` | body `overflow` lock while mobile menu is open | N | set in the handlers |
| 5 | `components/FredbotPanel.jsx:72` | clears wait indicator when reply content arrives | K derived state | kept |
| 6 | `components/FredbotPanel.jsx:86` | ends intro wait once reply has content and intro is done | K derived state | kept |
| 7 | `components/FredbotPanel.jsx:96` | agent `RUN_ERROR` subscription | K subscription | kept |
| 8 | `components/FredbotPanel.jsx:112` | 900 ms boot delay | F | `useTimeout` |
| 9 | `components/FredbotPanel.jsx:123` | warm-up `fetch` on mount | K fetch on show | kept |
| 10 | `components/FredbotPanel.jsx:131` | scrolls log to bottom on new turn or sequence change | K DOM follow | kept |
| 11 | `components/FredbotPanel.jsx:135` | focuses input when idle after a visitor interaction | K DOM focus | kept |
| 12 | `components/terminal/TypedMarkdown.jsx:32` | mirrors token count into a ref | N | removed (see 13) |
| 13 | `components/terminal/TypedMarkdown.jsx:34` | word reveal timer | F | `useInterval` |
| 14 | `components/terminal/TypedMarkdown.jsx:58` | keeps reply in view while near bottom | K DOM follow | kept |
| 15 | `components/terminal/TypedMarkdown.jsx:70` | `onSettled` once, after final reveal | K derived event | kept |
| 16 | `components/terminal/ThinkingSequence.jsx:175` | mirrors `onDone` into a ref | K ref sync | kept |
| 17 | `components/terminal/ThinkingSequence.jsx:177` | line-by-line animation loop | K terminal animation | kept |
| 18 | `components/terminal/ThinkingSequence.jsx:243` | keeps log in view while near bottom | K DOM follow | kept |
| 19 | `lib/useHashScroll.js:10` | scrolls to URL hash after navigation | K navigation sync | kept (part 2) |
| 20 | `lib/useBlogAvailable.js:17` | blog list request with retries | K fetch on show | kept |
| 21 | `lib/useToolTimings.js:11` | agent tool-call event subscription | K subscription | kept |
| 22 | `lib/useDocumentHead.js:6` | sets title and robots meta while shown | F | moved to `lib/effects/useDocumentHead.js` |
| 23 | `pages/ProjectPage.jsx:33` | scroll to top when project changes | N | ref callback with `key={slug}` on the root |
| 24 | `pages/About.jsx:8` | scroll to top on mount | N | ref callback, `useScrollToTopRef` |
| 25 | `pages/BlogPost.jsx:19` | scroll to top when slug changes | K | kept: scroll timing depends on load state |
| 26 | `pages/BlogPost.jsx:23` | post `getPost` request with abort | K fetch on show | kept |
| 27 | `pages/BlogIndex.jsx:47` | list request per tag, with retry | K fetch on show | kept |

Part 1 removes 9 call sites: rows 1, 3, 4, 8, 12, 13, 22, 23, 24. Row 22 moves into the folder and stays an effect there. Part 1 leaves 18 calls in 9 files (the baseline).

## 2. The rule

Exact config, added to `frontend/eslint.config.js` after the main JS/JSX block. The object carries `files: ['**/*.{js,jsx}']`: flat config applies a `files`-less object to `.js` only, so `.jsx` components would escape.

```js
const EFFECTS = ["useEffect", "useLayoutEffect", "useInsertionEffect"];
const noEffects = {
  files: ["**/*.{js,jsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{ name: "react", importNames: EFFECTS,
        message: "No effects in components. Use a hook from src/lib/effects/ (see docs/development.md)." }],
    }],
    "no-restricted-syntax": ["error",
      { selector: "MemberExpression[property.name=/^use(Layout|Insertion)?Effect$/]", message: "No effects in components." },
      { selector: "MemberExpression[property.value=/^use(Layout|Insertion)?Effect$/]", message: "No effects in components." },
    ],
  },
};
const effectsFolder = { files: ["src/lib/effects/**"], rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" } };
```

Rules:
- Core ESLint rules only. No plugin, no new dependency.
- The first selector catches `React.useEffect` and `ns.useLayoutEffect`; the second catches `React["useEffect"]`.
- `no-restricted-imports` checks the imported name, so `import { useEffect as e }` is caught.
- Exemption is by folder only (`src/lib/effects/**`), never by line or by comment. A file under `src/` must not contain an `eslint-disable` for either rule; a test checks this.
- Part 1 sets no rule to `warn`.

## 3. The effects folder

`frontend/src/lib/effects/` holds named hooks. Each hook:
- takes plain arguments (no object of callbacks, no generic lifecycle wrapper);
- has one unit test (`*.test.jsx`, Testing Library `renderHook`, fake timers where timers matter);
- has no comments.

Part 1 hooks:

| Hook | Signature | Behaviour |
|---|---|---|
| `useEventListener` | `(target, type, handler, options)` | Adds one listener; handler kept current through a ref; removed on unmount or when `type`, `target`, `capture` or `passive` change. |
| `useInterval` | `(callback, delay)` | `setInterval` every `delay` ms; `null` pauses; callback kept current through a ref. First call after one `delay`, never at mount. |
| `useTimeout` | `(callback, delay)` | One `setTimeout`; `null` never fires; cleared on unmount; callback kept current through a ref. |
| `useDocumentHead` | `({ title, noindex })` | Moved unchanged from `src/lib/useDocumentHead.js`. Sets `document.title` and adds a `robots` meta when `noindex`; restores both on unmount. |

Outside the folder, `src/lib/useScrollToTopRef.js` exports `useScrollToTopRef()`. It returns a stable ref callback that calls `window.scrollTo(0, 0)` when a DOM node attaches. It contains no effect; it is a ref, so the rule does not apply.

Part 2 candidates (added only when part 2 needs them): `useSubscription(subscribe)`, `useAsyncData(load, key)`, `useWidget(mount)`, `useController(create)`. No `useMount`, no `useOnChange`: a generic wrapper hides what the code does.

Why `useDocumentHead` moves rather than becoming `useDocumentTitle(title)`: `noindex` also needs a cleanup that removes the meta element, and React 18 has no non-effect way to set `document.title` and restore it on unmount. Keeping one hook with the existing signature avoids a second hook that duplicates it.

Why `useHashScroll` stays outside the folder in part 1: it runs on every location change and its target may mount later; part 2 decides its shape. Moving it now would add files without removing a risk.

## 4. Cheat sheet

Also in `docs/development.md`, section "Effects" (added in part 1), which the rule message points to.

| You wanted an effect to... | Do this instead |
|---|---|
| compute a value from props or state | compute it in render: `const shown = items.filter(...)` |
| reset state when an id changes | put `key={id}` on the component; React remounts it with fresh state |
| respond to a click, submit or change | put the logic in the event handler |
| set state after a child reports something | pass the value up in the handler that caused it |
| set body or document style while a panel is open | set it in the open and close handlers |
| listen to `window` or `document` events | `useEventListener(window, 'scroll', handler, { passive: true })` |
| run something repeatedly | `useInterval(callback, ms)`; `null` pauses |
| run something once after a delay | `useTimeout(callback, ms)` |
| scroll to top when a page mounts or changes | `const scrollToTop = useScrollToTopRef();` on the page root; add `key={id}` to the root to remount on change |
| set the tab title while a page is shown | `useDocumentHead({ title, noindex })` |
| subscribe to an external store or agent | kept for part 2 (`useSubscription`) |
| fetch data when a page or panel shows | kept for part 2 (`useAsyncData`) |
| mount a third-party widget into a node | kept for part 2 (`useWidget`) |

## 5. The two parts and the baseline

Part 1 (PW-80, one PR, 25 changed files including docs):
- adds the rule, the effects folder, `useScrollToTopRef` and the fixture test;
- removes 9 call sites (section 1, rows 1, 3, 4, 8, 12, 13, 22, 23, 24);
- lists the 9 files that still contain a call in `effectBaseline`.

Baseline files after part 1:

```
src/components/Diagram.jsx
src/components/FredbotPanel.jsx
src/components/terminal/ThinkingSequence.jsx
src/components/terminal/TypedMarkdown.jsx
src/lib/useBlogAvailable.js
src/lib/useHashScroll.js
src/lib/useToolTimings.js
src/pages/BlogIndex.jsx
src/pages/BlogPost.jsx
```

The baseline is a `files` override in `eslint.config.js` that sets both rules to `off`, exported as `effectBaseline`. The fixture test in `frontend/src/lint/noEffects.test.js` fails when:
- a file outside the folder (test files excluded) contains `use(Layout|Insertion)?Effect` but is not listed; or
- a listed file no longer contains one.

So the list is exact: a file leaves it in the same change that removes its last call.

Part 2 (PW-81): converts or moves the 18 remaining calls, removes every entry, and leaves `effectBaseline` as an empty array. With an empty array the override matches nothing, and the fixture test checks that no effect hook is left outside the folder.

## 6. Acceptance and risks

Acceptance for part 1:
- `cd frontend && npm run lint && npm test` pass.
- `npm run e2e` passes (builds, then Playwright; see `docs/development.md`, "Browser tests").
- The PR description lists the before and after of the 27 calls (section 1 table, with the result column filled in).
- `effectBaseline` has 9 entries, down from 15.
- No changed file gains a comment. `git diff origin/main -- frontend/src | grep '^+' | grep -E '^\+\s*(//|/\*)'` prints nothing.
- The PR changes 25 files or fewer, counting docs.

Risks:
- TypedMarkdown: the reveal timer moves from a self-rescheduling `setTimeout` chain to `useInterval`. The first word must still appear at mount, so `revealed` starts at `min(tokens.length, WORDS_PER_TICK)`. The existing test "reveals the text one word per tick" checks this.
- Headers: the body `overflow` reset moves from effect cleanup to the handlers. `App.jsx` renders `Header` once, outside `Routes`, so it never unmounts; no reset on unmount is needed.
- ProjectPage: `key={slug}` on the article remounts it on project change. The engineer toggle lives in `sessionStorage` and in `ProjectPage` state, not in the article, so it survives.
- Scroll on mount via a ref runs in the commit phase, before paint, like a layout effect. For `PrivacyPolicy`, `About` and `ProjectPage` the timing matches the old effect within one frame; no visible change is expected.
- ESLint in tests: the fixture test uses the ESLint Node API under vitest's jsdom environment. If jsdom breaks it, the fix is a `test.environmentMatchGlobs` entry in `frontend/vite.config.mjs`, not a comment in the test file.
- The e2e `no-restricted-syntax` override for `e2e/**/*.spec.js` replaces this rule's options for spec files. Spec files contain no effects, so no check is lost; the fixture test does not cover them.
- A part 1 reviewer should confirm that the folder holds only named hooks and that no file outside it gained a call.
