# Async boundaries and AnimalTester — 9 September 2026

This pass improves calendar validation and failure reporting, preserves rejected
save promises, and separates the animal activity's view, session state, and
collection requests.

## Behavior changes

- Both cached and fetched calendar data must have valid date keys and boolean
  `isNonSchoolDay` values. Invalid or expired caches fall back to the network.
  Blocked/full storage does not discard a valid response. Cancelled requests do
  not update the component or write a late response into the cache.
- Calendar failures expose a retry action and explain the weekend-only fallback.
- Chore and reward forms return their save promises to the shared action row.
  It blocks duplicate save/back actions while pending, reports rejection, retains
  the draft, and allows retry. Existing page-level error handlers still apply.
- Reward purchase failures propagate to the existing card error boundary instead
  of being swallowed by the page. The pending redemption flag clears on failure.
- Confetti's asynchronous result joins its existing rejection handler. Stored
  child-selection JSON is narrowed from `unknown` before reading its fields.

## Animal activity structure

`AnimalTester.tsx` renders the activity. `useAnimalSession.ts` owns question
progress, outcomes, feedback timers, and clue reveal. Its shared initial round
state replaces repeated individual resets for navigation and new sessions.
`useCreatureCollection.ts` owns cached selection, loading, retry, and request
invalidation. Only the current request can install a catalog or report an error;
unmount invalidates outstanding requests.

The existing collection, learning, solo, two-player, theme, and artwork tests pass.
A focused lifecycle regression additionally verifies that reset and unmount
cancel a queued completion callback.

## Measurements and tradeoffs

Tool: ts-react-quality-lens 0.3.0, revision
`986c6fd9cc82627866156ba0cf22cb1504ab8587`. The baseline retains the preceding
large-number changes. Typed lint ran completely for both sides, using an explicit
absolute `tsconfig.app.json` path. The baseline was reconstructed in an isolated
source fixture; only syntax/typed-lint comparisons are made against that fixture,
not history-dependent locality scores. Earlier scratch runs without a resolved
compiler configuration were excluded from the comparison.

| Measure                                       |  Before |   After |
| --------------------------------------------- | ------: | ------: |
| Blocking typed-lint findings                  |      62 |      47 |
| AnimalTester main callable lines              |     379 |     166 |
| AnimalTester main cognitive complexity        |      19 |      14 |
| AnimalTester main cyclomatic complexity       |      19 |      14 |
| Animal subsystem summed Halstead effort       | 748,822 | 567,954 |
| Animal subsystem source lines                 |   1,039 |   1,105 |
| Animal subsystem summed cognitive complexity  |      62 |      64 |
| Animal subsystem summed cyclomatic complexity |      73 |      80 |

The subsystem includes the original view and both extracted hooks. Its estimated
effort falls 24.2%, while total lines and summed complexity increase. This is a
separation of responsibilities and removal of repeated reset logic, not a claim
that every extraction reduces every metric. The schema, retry behavior, and
regression tests also add code. No suppression or exclusion was introduced to
improve a score. Halstead effort is a static estimate, not measured developer time.

The remaining 47 blocking typed-lint records include four previously identified
React Refresh rule-availability errors in Lens. Promise callback contracts and
unsafe assertions elsewhere remain follow-up work; this pass does not claim all
async failure paths are now covered.

[Comparison JSON](async-animal-comparison.json) records aggregation results and
source hashes. Raw evidence remains locally in `tmp/async-verified-before` and
`tmp/async-verified-after`; their matching config files are in `tmp`.

## Verification

- All 154 unit/component cases pass with four Vitest workers, including nine
  targeted regressions for these changes.
- Production TypeScript/Vite build passes.
- Chromium, Firefox, and WebKit sign-in smoke tests pass with one worker. The
  initial concurrent browser run timed out during navigation while other checks
  were running; the subsequent isolated run passed without changing the tests.
- ESLint passes with eight existing React Refresh warnings. Formatting and
  `git diff --check` pass.

The browser smoke test covers unauthenticated routing. Firebase transaction
failure behavior is exercised with mocks; no deployed or emulated backend
transaction was run. No execution-coverage percentage is claimed.
