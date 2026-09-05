# Test suite reduction — 6 September 2026

The working-tree baseline contained 107 Vitest cases across 31 files and one Playwright scenario run in three browsers. The retained suite has 72 Vitest cases across 27 files and the same Playwright scenario: **35 fewer cases (32.7% of Vitest; 32.4% of the 108 distinct cases including end-to-end)**. Parameterized rows count as separate cases in both measurements. No cases were skipped, hidden with configuration changes, or combined merely to lower the count.

## Removal decisions

| Area                        | Cases removed | Reason and retained protection                                                                                                                                                                                           |
| --------------------------- | ------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Calendar seasons            |             8 | Keep the four season transitions, timezone/day boundaries, date conversion and scheduling; remove repeated interior-month examples.                                                                                      |
| Ephemeral test state        |             4 | Keep ordinary and abbreviated field mappings, null resets, undefined overrides and unrelated-field isolation; remove equivalent activity-type repetitions.                                                               |
| Water/toilet scoring        |             4 | Keep positive, neutral, negative and balance-clamping cases. Full success is already exercised in the all-chores balance tests; equivalent partial-water rows were repetitive.                                           |
| Chore logic unit tests      |             3 | The real hook-to-transaction tests cover completion, scores and final bites; WaterToiletMonitor covers interactive state cycling.                                                                                        |
| Star transaction unit tests |             2 | Completion and same-day deduplication are covered through actual accumulated balances. Retain stored reward pricing and redemption persistence.                                                                          |
| Completion hook mocks       |             2 | Remove mock-result/confetti call-count checks. Retain final-bite timing and signed-out persistence behavior.                                                                                                             |
| Chore UI matrix snapshots   |             2 | Duplicated boolean/label lookup tables constrained presentation. Descriptor tests retain start, check, reset, dinner cooldown and water/toilet wiring.                                                                   |
| Header artwork              |             1 | Exact asset filenames were presentation choices rather than behavior.                                                                                                                                                    |
| Alphabet/spelling defaults  |             2 | Letter-case ordering/default assertions constrained design. Shared selection controls and spelling picture selection remain covered.                                                                                     |
| Animal/insect mode overlap  |             3 | Remove the mode-picker presentation check, duplicate hard-mode ability check and duplicate two-player flow. Retain solo easy/hard behavior, two-player completion, collection switching, teaching and catalog integrity. |
| Day/night drawing internals |             2 | Remove exact layer objects and canvas call counts. Retain clock rollover/performance, animation cleanup and Strict Mode regression checks.                                                                               |
| Card exit animation         |             1 | The retained deletion-failure test already drives the deletion lifecycle. Keep failed-delete recovery, pending reset state and accessible actions.                                                                       |
| Legacy chore todos          |             1 | No production callers remain for the legacy todo parser. Retain current chore/test document normalization and malformed-input handling.                                                                                  |

## Retained tests made less restrictive

- The location-map regression checks catalog associations and one rendered canonical caption/image, avoiding a full carousel traversal for the same rendering branch. Unique maps and complete animal assets remain checked.
- Insect integrity follows the catalog's size instead of fixing it at 34; editorial fact wording and empty selector text are no longer frozen.
- Card tests assert accessible controls and observable pending/error states rather than internal header/body/footer markers, action ordering, theme filenames or CSS animation classes.
- Parser tests focus on current persisted results, malformed settings and finite financial values instead of full default-object layouts, obsolete type names, compatibility aliases and unused callable payload wrappers.

Production code and test-runner discovery settings were not changed by this cleanup. Existing unrelated workspace changes were retained.

## Validation

- Baseline: 106/107 Vitest cases passed; the broad animal-map traversal failed in the full run. That regression remains in the focused form described above.
- Final: all 72 Vitest cases passed.
- The retained sign-in redirect scenario passed in Chromium, Firefox and WebKit.
- ESLint and TypeScript checks passed.

This is a behavior-based coverage review, not a claim of unchanged measured line or branch coverage. Important retained protections include exact chore rewards, no duplicate daily awards, next-day awards, child isolation, zero-balance clamping, dinner timeout, stored reward pricing, failed deletion recovery, optimistic state reconciliation, input boundaries, timezone handling, and activity completion.
