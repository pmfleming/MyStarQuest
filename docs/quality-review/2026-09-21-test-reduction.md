# Test reduction — 21 September 2026

Reduced the suite from **254 to 170 distinct test cases**: **84 removed (33.07%)**, retaining **66.93%**. The requested 67% target is 170.18 cases; 170 is the nearest whole number.

## Counting rule and evidence

Count each registered test case, including expanded parameterized rows. Count a Playwright scenario once, even when it runs in three browsers. Include the Node tooling and Android unit/device tests. The baseline was captured before edits with `vitest list --json`, Playwright discovery, and the Node/Java declarations. The final Vitest count comes from the executed JSON report, not a text search or a file count.

| Suite                   |  Before |   After | Removed |
| ----------------------- | ------: | ------: | ------: |
| Vitest                  |     239 |     158 |      81 |
| Node tooling            |       3 |       2 |       1 |
| Playwright scenarios    |       5 |       5 |       0 |
| Android unit            |       4 |       3 |       1 |
| Android instrumentation |       3 |       2 |       1 |
| **Total**               | **254** | **170** |  **84** |

Test-source lines fell from **7,832 to 6,808**, excluding fixtures, setup, documentation and generated files. No production code, runner configuration or discovery exclusions changed. No skipped/todo tests were introduced and unrelated cases were not combined to lower the count.

The [machine-readable manifest](2026-09-21-test-reduction.json) lists every removed case and per-file counts. Raw discovery/execution reports and the pre-edit source snapshot are in the ignored local directory `output/test-reduction`.

## Removal decisions and retained protection

| Removed or reduced                                                                                                                                                               | Retained coverage                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar catalog: 26 → 4. Repetitive literal translations and holiday aliases.                                                                                                   | Representative day-off, activity/sibling-photo specificity, optional-word early finish, unknown fallback; UI checks still cover photos, teacher training, autumn/Christmas breaks and English labels.                                        |
| Weekly schedule: 27 → 9. Repeated weekday/lesson constants, redundant editor-invalid values and storage round-trip.                                                              | Custom early release/commute shift, lesson boundaries, every-day interval consistency, malformed/blocked storage, invalid clock/interval/weekday input and duplicate IDs; UI retains saved changes and month-end navigation.                 |
| Calendar expansion: 10 → 6; calendar UI: 9 → 6. Repeated activity names and equivalent theme executions.                                                                         | Recurrence/exclusive ranges, DST, overlapping and zero-duration events, simultaneous activity/day off, early-finish time, theme artwork and holiday UI. Different retained UI cases exercise each theme.                                     |
| Calendar store: 13 → 10; duplicate data-layer file: 4 → 0. Same fallback repeated for several transport errors, duplicate restart count, legacy cache representation checks.     | First offline launch, durable replacement/deletions, corrupt storage, failed fetch/schema with preserved snapshot age, refresh triggers, native updates, storage-full behavior, stalled requests and stale-response rejection.               |
| Route preloader, Firebase initialization, first-paint helper and boundary listener tests. Internal import/resolver ordering, scheduler strategy and exact listener registration. | Auth restoration, web/native sign-in and cancellation, blocked storage, protected-route sign-in, lazy-route failure/navigation, offline browser recovery and cancellation after calendar unmount.                                            |
| Exact animation phase timings, repeated theme animation runs, reduced-motion count-up internals and GPU/layout call counts.                                                      | Interrupted/current star balance, zero/high balances, keyboard replay, timer cleanup, celebration retention/failure/child switching, renderer disposal and deferred-renderer cancellation/retry.                                             |
| Repeated creature interactions, already-loaded catalog switching and wardrobe placement.                                                                                         | Catalog/photo integrity, hard-mode answers, wrong/correct choice handling, two-player hidden answers, portrait gestures, keyboard controls, image failure fallback and collection request races/retry.                                       |
| Duplicate optimistic object-identity, lost-response and overspend projection tests; one legacy import case and weekday alias matrix row.                                         | Complete/partial acknowledgment, rollback without erasing newer edits, coalesced writes/unmount flush, browser lost-response deduplication, offline debit/earnings, migration duplicate-award prevention and explicit scheduling precedence. |
| Upstream Lens policy integration and generated Android 2+2/package-name examples.                                                                                                | Project gate acceptance/rejection and metric aggregation contracts; all real Android calendar validation, saved-snapshot and background-scheduling cases.                                                                                    |

The reduction deliberately drops exhaustive checks of low-risk literal catalog mappings and several internal optimization choices. Representative coverage does not imply identical line/branch coverage: no coverage percentage was collected. Calendar release/holiday behavior, cross-account isolation, star accounting, offline durability, mutation rollback, reset failure and asynchronous cancellation remain covered.

## Validation

- **158/158 Vitest cases passed**, with no skipped or todo cases.
- **2/2 Node tooling checks passed.**
- All three standard browser scenarios passed in **Chromium, Firefox and WebKit: 9/9 runs**.
- Both production Chromium offline scenarios passed: **2/2**.
- Android unit tests passed: **3/3**; retained Android instrumentation compiled successfully. Its two device tests were not executed on a device/emulator in this run.
- ESLint for all retained tests passed. Formatting and whitespace checks passed.

Reproduce execution with `npm test`, `node --test scripts/quality-summary.test.mjs`, `npx playwright test --workers=2`, `npx playwright test --config playwright.offline.config.ts`, and, from `android`, `./gradlew.bat testDebugUnitTest compileDebugAndroidTestJavaWithJavac`.
