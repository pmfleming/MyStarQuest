# Test reduction — 29 September 2026

The target is **119 tests**, down from **177**: 58 fewer runnable cases, a
**32.77% reduction**. This is the nearest whole number to 67% of the baseline
(177 × 0.67 = 118.59).

TypeScript test source decreased from 6,130 to 5,301 lines: **829 lines removed**.

The baseline was captured from the working tree at the start of this task,
including the earlier uncommitted feature and dependency changes. It is not a
comparison with Git HEAD.

## Counting method

Count runner-expanded test cases: parameterized Vitest cases, each configured
Playwright browser execution, Node tests, and Android test methods. Include device
tests in both inventories even when no device is connected. Fixtures, assertions,
test suites and helper functions are not separate tests.

| Runner                                       |  Before |   After | Reduction |
| -------------------------------------------- | ------: | ------: | --------: |
| Vitest                                       |     144 |      98 |        46 |
| Playwright development flows, three browsers |      24 |      12 |        12 |
| Playwright production offline flows          |       2 |       2 |         0 |
| Node scripting tests                         |       2 |       2 |         0 |
| Android JVM tests                            |       3 |       3 |         0 |
| Android device tests                         |       2 |       2 |         0 |
| **Total**                                    | **177** | **119** |    **58** |

Chromium, Firefox and WebKit remain enabled. Browser repetitions counted once
would give a different inventory: 161 → 111 logical cases. The 67% target above
uses runnable cases consistently before and after.

## Review decisions

Tests were deleted, repeated input combinations reduced, and overlapping checks
consolidated into existing behavior scenarios. No tests were disabled, skipped,
marked todo, or excluded through runner configuration.

| Area                  | Removed overlap                                                                                    | Retained behavior and failure checks                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fraction generation   | Repeating the same generator contract for every intermediate maximum; older-record fallback checks | Minimum 2 and maximum 9, valid choices, exactly one equivalent answer, all levels and their numerator rules; field validation remains in `taskLimits`                                           |
| Fraction UI           | Separate recognition and advanced happy paths; a single read-only visibility check                 | Advanced recognition now checks a wrong answer, successful retry, exactly one completion and reset. Guided hints, unlimited retries, saved limits and limits fixed for the current round remain |
| Shared star control   | Separate icon-count, compact-display and animation-duration tests; duplicate bounds checks         | The fraction limit test now exercises the real shared control with an asynchronous save, repeated clicks, and both bounds                                                                       |
| Browser fractions     | Six theme/mode combinations reduced to two complementary flows                                     | Teenie covers a complete game at ninths, keyboard input, slice shortcuts and touch input. Princess covers multiple-piece fractions. Both run at phone width in all three browsers               |
| Weekly schedule       | Duplicate full-day weekdays, a second weekend day, and generic legacy school-block compatibility   | Full school day, both distinct short-day end times, closure days, early dismissal, quarter-hour boundaries, lesson interruptions and invalid saved ranges                                       |
| Calendar presentation | Exact classroom artwork lookups for both themes                                                    | School activity translation, timed/all-day entries, school status, month clamping, saved schedule updates and empty schedules                                                                   |
| Calendar feed         | Separate DST range and title-classification helper checks                                          | Recurring all-day ranges now cross DST and verify exclusive ends. Event merging checks that an inherited object-property name does not close school                                             |
| Calendar cache        | Repeated store setup for success, failure and native notifications                                 | Web refresh persists deletions and then survives an invalid response. Native refresh times out, retries, ignores older results and accepts background updates                                   |
| Authentication        | Separate restored-session and requested-popup setup                                                | One web session restores, signs out, rejects a cancelled popup and allows retry. Native credential sign-in remains separate                                                                     |
| Star transactions     | Separate next-day setup and separate wrong-child chore setup                                       | The attempt lifecycle includes duplicate callbacks, same-day reset and the next day. The chore integration rejects another child's task before awarding valid chores                            |
| Dinner                | A separately mocked final-bite reset test                                                          | The real action/transaction integration checks reset cancellation and timeout without awarding stars                                                                                            |
| Optimistic edits      | Direct helper identity/shape assertions                                                            | The coalesced-write hook retains newer fields through failure and partial/missing acknowledgements; reset rollback and profile rollback remain in their integration tests                       |
| Offline store         | A schema self-check and a memory-only reopening test                                               | Real IndexedDB reopening and ordered multi-tab writes remain in every browser. Disk failures, stale snapshots, account/child isolation, replay deduplication and conflicting edits remain       |
| Service worker        | A second failed-installation input                                                                 | A broken HTML-as-JavaScript deployment preserves the old working cache. Offline production startup, authentication/API bypass and recovery remain                                               |
| Creature collections  | Separate retry and late-response setup                                                             | One selection flow fails, retries, switches collections, ignores the late response and never awards completion. Animal reset/unmount cancellation remains a separate regression test            |
| Globe                 | Separate successful hide/show setup                                                                | Renderer failure, retry, hide/dispose and restoration with current scene state form one lifecycle                                                                                               |
| Drag scrolling        | Repeated selector exclusions and non-scrollable/right-button checks                                | Interactive controls remain usable; movement threshold, suppressed drag click and subsequent normal clicks remain                                                                               |
| Shared cards/menu     | Reset callback forwarding, repeated shared confirmation details and celebration timing             | Child deletion still requires confirmation; failed deletion/reset stays visible and retryable; switching children cancels stale celebrations; pending reset navigation remains covered          |
| Weather               | Separate helper-level age checks also exercised by the store                                       | Provider validation includes invalid, future and previous-local-day observations. Cache tests retain stale labels, retry, expiry and city isolation                                             |
| Date/location helpers | Repeated helper examples, city lookup tables and a year-long inverse round trip                    | Explorer tests retain exact instants across midnight, city switching, session restoration and DST reset. Geolocation timeout remains; orbit tests retain leap day and year-boundary continuity  |
| Content/artwork       | Fixed theatre programme details and historical spelling-to-artwork aliases                         | Theatre/school feed coexistence remains; exact filenames and a particular programme's price/content are no longer test contracts                                                                |

The reductions deliberately narrow repeated input sampling and cosmetic details.
They do not establish identical line or branch coverage; instrumentation coverage
was not collected. The retained tests focus on observable behavior, data integrity,
boundary conditions and recovery.

## Validation

- Baseline Vitest: 144 passed.
- Final Vitest: 98 passed; no skipped or todo tests.
- Browser flows: 12 passed across Chromium, Firefox and WebKit.
- Production offline flows: 2 passed.
- Node scripting tests: 2 passed.
- Android JVM tests: 3 passed; instrumentation APK assembles. The 2 device tests
  remain in the suite but could not run because `adb devices` reports no device.
- Quality Lens 0.3.0: complete audit, zero blockers, 49 existing warnings.
- Formatting and repository lint pass after the final edits.

The machine-readable [inventory](2026-09-29-test-reduction.json) records per-file
counts and test-source line totals. Local runner reports and the original test
sources are saved under `output/test-reduction/` for comparison. Production code
and runner/browser configuration were not changed by this task.
