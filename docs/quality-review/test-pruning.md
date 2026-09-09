# Test suite pruning — 2026-09-09

Baseline: commit `48e4569`, with 207 passing Vitest cases in 48 files.
After pruning: 141 cases in 46 files, a net reduction of 66 (31.9%).
The Playwright sign-in smoke test still runs in Chromium, Firefox, and WebKit.
No production code, test discovery configuration, or skip rules changed.

## Removed overlap

Counts include expanded parameterized cases, not just `it` declarations.

| Area                                | Before | After | Reason                                                                                                                                         |
| ----------------------------------- | -----: | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Test persistence/reset              |     42 |     7 | Exercise the shared persistence flow once per distinct scenario, instead of repeating all seven scenarios for each of six types.               |
| Immediate activity reset            |      7 |     2 | Keep immediate stop and cancellation during delayed answer feedback; the activity-state suite separately checks every type.                    |
| Chore persistence/reset             |     12 |     9 | Completed and expired dinners use the same reset path. Keep standard, dinner, and water/toilet persistence; dinner expiry has dedicated tests. |
| Test renderer wiring                |     12 |     6 | Keep all six current task types; remove obsolete daily `TodoRecord` rendering contracts.                                                       |
| Chore descriptors                   |      4 |     2 | Remove old test-task action wiring and a duplicate-star layout prohibition. Use current task records for dinner and water/toilet behavior.     |
| Animal / insect / Teenieping suites |     19 |    12 | Remove repeated theme/difficulty combinations, duplicate shared two-player and collection-switch flows, and fixed caption assignments.         |
| Collection loading                  |      6 |     4 | Remove two collection-icon presentation checks; retain loading, failure/retry, stale-result, and pending-start behavior.                       |
| Theme switching                     |      5 |     2 | Remove fixed menu inventory and historical theme migrations. Keep child switching/remount and safe handling of unknown identifiers.            |
| Theme assets                        |      5 |     3 | Remove duplicate saved-key assertions and fixed inventory sizes; retain current asset completeness and missing-asset checks.                   |
| Loading indicator                   |      3 |     2 | Remove exact animation angles and timing progression; retain accessible loading state, reduced motion, and unmount cleanup.                    |
| Day/night                           |      3 |     2 | Remove a Strict Mode timer/text assertion that did not verify animation restart; retain clock rollover and cleanup.                            |
| Action list                         |      4 |     3 | Remove eager/lazy artwork policy; retain accessible actions, editing, and reset behavior.                                                      |
| Preload and star-display files      |      2 |     0 | Remove exact preload order/count and the fixed compact-display threshold/style contract. Star editing remains covered by ActivityControls.     |
| Daily state field mapping           |      4 |     8 | Add explicit mappings for the four previously untested activity types to support the smaller persistence matrix.                               |

## Retained and strengthened behavior

- Test persistence still covers default-record creation and remount, replay after success and failure, both write/snapshot arrival orders, and rollback/retry after failed resets for both prior outcomes.
- Distinct chore reset paths retain both arrival orders and failed-write recovery. Dinner expiry, final-bite cooldown, and no-star-on-timeout behavior remain covered separately.
- Star awards retain one-time/repeating behavior, duplicate and daily award protection, water/toilet deductions and clamping, and cross-child rejection. Reward transaction pricing remains covered.
- The reward-availability test now checks actual disabled purchase buttons for insufficient stars, pending redemption, and no selected child, plus a successful purchase at the exact price. It previously checked lock artwork.
- Reward creation still verifies saved fields and cancellation; cancellation now explicitly asserts that no save occurs. Exact field order and exit-icon filenames are no longer required.
- Async collection loading retains failures, retries, stale results, and delayed starts. Catalog integrity, alternate-form distractor exclusion, solo and two-player completion, and collection switching remain represented.
- Calendar/DST rules, activity exclusivity, queued-result cancellation, alphabet behavior, navigation, timer cleanup, and authentication smoke tests remain.
- Removed CSS animation values, exact render counts, fixed catalog sizes, and prohibitions on alternative navigation controls from otherwise useful tests.

## Validation

Validation passed: 141/141 Vitest cases, 3/3 Playwright browser runs, lint with
zero errors and eight existing React Refresh warnings, and Prettier on changed
files. `git diff --check` also passed.
Before/after inventories were collected using Vitest's JSON reporter, including
expanded cases. The reduced suite has no skipped or pending cases. This review
maps retained behavior; it does not claim an unchanged line or branch coverage
percentage.

Future tests should add a distinct behavior, regression, contract, or failure
mode. For shared implementations, test the behavior with a representative fixture
and cover type-specific configuration separately. Add combinations only when the
interaction itself changes behavior. Avoid freezing historical schemas, artwork
inventories, layout order, or internal scheduling without a current requirement.
