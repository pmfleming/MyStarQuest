# Test reduction — 14 September 2026

Reduced the current suite from **233 to 156 runnable cases**: **77 removed, a 33.05% reduction**, retaining **66.95%**. The requested target is `round(233 × 0.67) = 156`.

The baseline is commit `647716f`, immediately after the offline quality refactor. Counts come from runner discovery and execution, including expanded parameterized rows and separate browser projects. Assertions, describe blocks, fixtures, and helpers are not test cases.

| Runner                                |  Before |   After | Removed |
| ------------------------------------- | ------: | ------: | ------: |
| Vitest                                |     224 |     147 |      77 |
| Node quality checks                   |       3 |       3 |       0 |
| Playwright: Chromium, Firefox, WebKit |       6 |       6 |       0 |
| **Total**                             | **233** | **156** |  **77** |

Production code, dependencies, runner configuration, discovery rules, and quality thresholds are unchanged. No cases were skipped, marked todo, or hidden through configuration. Removed cases were not repackaged into large combined tests to reach the count.

## Removal decisions

The [machine-readable removal log](2026-09-14-test-reduction.json) lists every removed case, retained cases in each affected file, before/after counts, and the reason for each change. It also records unchanged suites and verification results.

- **Visual values and internal layouts:** removed exact backdrop RGBA/interpolation snapshots, weather threshold/outfit lookup repetitions, eight-letter navigation window snapshots, image-filename matrices, scene-wide disposal counts, renderer-prop snapshots, and DOM identity/style restrictions. Retained interactive weather behavior, unknown-data handling, keyboard navigation, clue zoom, catalog integrity, and owned-resource cleanup.
- **Theme and catalog repetition:** kept one complete Insects/Teenie display-preference workflow instead of four executions of shared behavior. Removed repeated letter navigation and photo preference checks from neighboring suites. Separate animal, insect, and Teenieping gameplay and catalog-integrity checks remain.
- **Low-level helper policy:** removed exact preload-cache capacity, collection memoization/reference identity, fresh-calendar no-fetch policy, and generic subscription identity assertions. Kept failed-image retry, stale-response isolation, offline calendar fallback, cache corruption/write failures, and application-level loading/retry behavior.
- **Duplicate persistence and reset coverage:** reduced repeated chore awards, reset ordering, task-field mappings, and durable-write failure scenarios. The retained tests exercise one-time and repeating rewards, signed amounts, same-day and next-day completion, resets, stale callbacks, account/child isolation, snapshot ordering, and rollback/retry.
- **Compatibility and thin wiring:** removed the legacy reset-wrapper response-shape test and tests that primarily asserted callback forwarding or a particular settings widget. Current backend reset/authentication tests, real creation/purchase flows, and failure-enabled/disabled gameplay remain.
- **Repeated calendar/math helpers:** retained shorter-month clamping, date round-trip, app-timezone day boundaries, DST/city conversion, ordered solar phases, and subsolar position. Removed additional month/year/season examples and low-level longitude/declination fixtures.

Two existing scenarios were adjusted to retain useful checks from lower-level tests: the Android completion/reload/reset flow now invokes the same completion callback twice before reset, and the failed-write ownership test restores an explicit `undefined` value while preserving a newer field edit. Neither changes the scenario's purpose or adds another test case. Unused imports and branches left by removed parameterized rows were cleaned up.

## Critical checks retained

- **Offline:** real IndexedDB reload/recovery in three browsers; independent device completions; exactly-once replay after a lost response; durable acknowledgement; server snapshot watermarks; ordered queues; account isolation; malformed persisted state; storage-open failure; deleted-child/definition conflicts; and authoritative versus partial SDK snapshots.
- **Stars and rewards:** stored prices, child ownership, duplicate callbacks, positive/zero/negative awards, zero-floor overspending without carrying debt into later earnings, one-time consumption, default-test creation/award atomicity, and failure/retry behavior.
- **Activities:** completion after the final answer, ignored clicks during feedback, failure-disabled retry, reset/unmount cancellation, dinner timeout and final-bite timing, reset rollback, and persistence recovery without replaying the puzzle.
- **Availability and lifecycle:** failed page/collection downloads, navigation during pending work, late responses, abandoned texture work, worker failure/timeout fallback, visibility/frame teardown, drag cancellation, stale weather, local midnight, and calendar cancellation.
- **Access and quality contracts:** sign-in routing in three browsers, backend authentication/input/ownership rejection, and Node checks that reject incomplete quality evidence and newly introduced blockers.

This is a behavioral coverage review, not a claim that line or branch coverage is unchanged. Exact visual thresholds/palettes, additional theme/calendar combinations, legacy wrappers, some settings/renderer wiring, and internal cache/resource-layout policies deliberately have fewer direct checks. The TypeScript project check covers application/configuration code under the existing tsconfigs; Vitest transforms the tests.

## Verification

- Fresh baseline Vitest run: **224 passed**, zero failures or pending cases.
- Final Vitest run: **147 passed**, zero failures or pending cases.
- Node quality checks: **3 passed**.
- Playwright: **6 passed** across Chromium, Firefox, and WebKit.
- ESLint, TypeScript project check, changed-test formatting, and `git diff --check` passed.

Local runner evidence is in `output/test-prune-*`. The committed JSON log preserves the durable count/removal record. No coverage or mutation run was performed, and this test-only change was not deployed.

## Reproduction

With root and Functions dependencies installed, run:

```powershell
npx vitest list --json=output/test-prune-list.json
npm run test -- --reporter=json --outputFile=output/test-prune-run.json
node --test scripts/quality-summary.test.mjs scripts/quality-gate.integration.test.mjs
npm run test:e2e -- --workers=1 --reporter=line
npm run lint
npx tsc -b
```

The Node integration check requires the repository's pinned Lens checkout built at `tmp/quality-lens-latest`. Repeat discovery at baseline commit `647716f` to compare against the same starting point.
