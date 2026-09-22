# Test reduction — 22 September 2026

Reduced the current working-tree baseline from **222 to 149 distinct tests**: **73 removed (32.88%)**, retaining **67.12%**. Exactly 67% of 222 is 148.74; **149 is the nearest whole-test target**. This baseline includes the Time Explorer, confirmation, persistence and refactor tests added since the previous reduction.

## Counting and scope

Count registered cases, including each expanded parameterized row. Count a Playwright scenario once across browsers. Include Node tooling and Android unit/device tests. Exclude fixtures, setup and generated code.

| Suite                         |  Before |   After | Removed |
| ----------------------------- | ------: | ------: | ------: |
| Vitest                        |     210 |     138 |      72 |
| Node tooling                  |       2 |       2 |       0 |
| Playwright distinct scenarios |       5 |       4 |       1 |
| Android unit                  |       3 |       3 |       0 |
| Android instrumentation       |       2 |       2 |       0 |
| **Total**                     | **222** | **149** |  **73** |

Test-source lines fell from **7,802 to 6,409**, a reduction of **1,393 lines**. Test files fell from 74 to 64. These figures compare this task's pre-edit snapshot with its final files, rather than comparing against HEAD, which also contains earlier uncommitted work.

The [machine-readable manifest](2026-09-22-test-reduction.json) names all 73 removed cases, explains each decision and identifies retained protection. It also records per-file counts. Baseline discovery, the original test sources and execution reports are saved locally in the ignored directory `output/test-reduction-2026-09-22`.

Only test files and this review documentation were changed for this reduction. No production code, runner configuration, discovery exclusions, skips or todo cases were added. No tests were combined into larger cases to lower the count. The final Vitest names are a strict subset of the baseline names. Two retained journeys gained focused assertions for the behavior they already exercise: selected panels after Now, and the protected-route login redirect.

## Decisions and retained protection

| Area                            | Removed or reduced                                                                                                                                                                                      | Retained protection                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time Explorer                   | Six panel-pair permutations, duplicate theme/city runs, repeated hidden-weather/FIFO journeys, direct storage round-trip, equivalent invalid-input variants.                                            | Full exploration and custom-weather restoration; all panels off; FIFO selection and two-panel limit; shared Now preserving selected panels; hidden-globe reset; exact seconds and cross-midnight city changes; invalid fields and blocked/full storage.                                                                                             |
| Confirmation and profiles       | Duplicate theme runs, child deletion failure already handled by the shared list, symmetric nullable selection-field cases.                                                                              | Child and reward cancel/confirm flows exercise different themes; focus restoration, disabled actions and shared failed-deletion handling; reset pending/cancel; remote profile reconciliation and rejected-edit rollback.                                                                                                                           |
| Calendar                        | Catalog literal inventories, repeated lesson/artwork fixtures, primitive schema variants, overlapping event fixtures and exact timer/request-count checks.                                              | Recurrence and exclusive ends, overlapping events and DST, custom noon release with shifted commute, week interval integrity, month-end navigation, saved edits, themed activities/holidays, durable replacement including deletions, malformed responses, native/web timeouts and stale-response rejection.                                        |
| Creature learning               | Exhaustive asset/count/credit inventories, fixed dinosaur catalog traversal and repeated solo completion.                                                                                               | Real animal two-player hidden/revealed answers and unscored exit, Teenieping hard-mode distractor identity and wrong/correct handling, real dinosaur picture gestures, keyboard photo controls, image failure/retry, collection request races and failed-load retry, cancelled completion after reset/unmount.                                      |
| Rendering and navigation        | Exact animation/frame/observer assertions, preload instance counts, shallow worker error mapping, repeated menu-title placement, a sign-out callback smoke check and route loading presentation checks. | Globe hide/show with current state and disposal, cancellation while loading, renderer retry, actual owned scene resource disposal, failed/stalled texture worker cleanup, topology decoding and numeric boundaries, final pointer position, failed lazy-route recovery, rapid native navigation and Back during saving.                             |
| Chores, stars and offline state | Legacy aliases/parser representations, compatibility-only import variants, neutral water score, exact final-bite timing and a happy batch test overlapped by multi-batch failure.                       | Positive/negative/clamped awards, dinner timeout, reset during final bite, duplicate awards and concurrent completions, next-day attempts, stored reward pricing, account/child isolation, atomic disk failure, durable queues/reopening, multi-tab sequence ordering, lost responses, rollback, import idempotency and server batch/auth failures. |
| Auth and weather                | Optional auth preload-hint storage check, duplicate login smoke, weather reconnect request counts and low-priority unknown-code imagery classification.                                                 | Session restoration, cancelled popup/native login, production protected-route redirect and offline sign-in recovery; missing provider values, invalid responses/ages, stale labeling, retry, expiry, local midnight and abandoned-city request cancellation.                                                                                        |

This is a prioritization of protection, not a claim of identical branch coverage. Dedicated checks for exhaustive artwork/credit metadata, exact animation and loading strategies, window-blur drag cleanup, some primitive schema restrictions, legacy representations and optional preload/reconnect optimizations were deliberately removed. No line/branch coverage percentage was measured. The retained behavioral tests still exercise the high-impact persistence, accounting, authorization, confirmation, recovery and exploration contracts listed above.

## Validation

- **138/138 Vitest tests passed**, with no skipped or todo cases. After removing unused harness code, the 12 affected tests passed again.
- **2/2 Node tooling tests passed.**
- Both standard browser scenarios passed in Chromium, Firefox and WebKit: **6/6 runs**, with no failures, skips or flaky results.
- Both production Chromium offline scenarios passed: **2/2**.
- Android unit tests passed on an explicit task rerun: **3/3**. The two retained device tests compiled; they were **not executed on a device/emulator**.
- Project ESLint and the frontend TypeScript/production build passed. Final touched-test lint, formatting and whitespace checks passed.

Reproduce with `npm test`, `node --test scripts/quality-summary.test.mjs`, `npx playwright test --workers=2`, `npx playwright test --config playwright.offline.config.ts`, and, from `android`, `./gradlew.bat :app:testDebugUnitTest --rerun` plus `./gradlew.bat compileDebugAndroidTestJavaWithJavac`.
