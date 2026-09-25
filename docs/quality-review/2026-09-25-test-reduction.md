# Test reduction — 25 September 2026

Reduced the current working-tree baseline from **180 to 121 distinct tests**, removing **59 (32.78%)** and retaining **67.22%**. Exactly 67% of 180 is 120.6; **121 is the nearest whole-test target**.

## Baseline and counting

The baseline was captured before pruning, after the reward overlay and quality refactor. Its 167 Vitest cases and two Node tests passed. Counts include expanded parameterized cases, each browser scenario once across browser projects, and Android unit/device tests. Fixtures, setup, dependencies and generated code are excluded. This follows the repository's previous test-reduction counting convention.

| Suite             |  Before |   After | Removed |
| ----------------- | ------: | ------: | ------: |
| Vitest            |     167 |     109 |      58 |
| Browser scenarios |       6 |       5 |       1 |
| Node tooling      |       2 |       2 |       0 |
| Android unit      |       3 |       3 |       0 |
| Android device    |       2 |       2 |       0 |
| **Total**         | **180** | **121** |  **59** |

Test-source lines fell from **7,251 to 5,561**, removing **1,690 lines**; test files fell from **73 to 64**. These figures compare the pre-edit source snapshot with the final files, not HEAD, which contains earlier uncommitted work. Unused imports and helpers were removed with their tests.

The [decision manifest](2026-09-25-test-reduction.json) identifies every removed case, its rationale, and retained protection. Original sources, baseline discovery and execution reports are preserved locally under `output/test-reduction-2026-09-25`.

## Selection and retained protection

The reduction prioritizes duplicate theme/year variants, catalogue inventories, exact geometry/callback-count assertions, legacy aliases, and lower-level repetitions of stronger behavioral journeys.

| Area                                 | Retained protection                                                                                                                                                                                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stars and account boundaries         | Multi-chore accounting, bounded deductions, dinner timeout, foreign-child rejection, atomic disk failure, stored reward prices, one-time consumption, concurrent completion deduplication, reset and next-day awards.                                                                         |
| Offline durability                   | Real production offline launch/save/reload, simultaneous browser tabs, lost-response replay, stalled-send recovery, ordered durable queues, damaged-operation preservation, account isolation, authoritative deletion and transaction conflicts.                                              |
| Learning                             | Fractions completion and small-phone controls in three browser engines, fractions hints/recognition, alphabet failure and feedback locking, arithmetic counter limits, Teenieping distractor identity, collection races/retry, reset cancellation, failed-save retry and keyboard navigation. |
| Destructive and asynchronous actions | Child confirmation, shared reset cancellation/pending/focus behavior, failed deletion, purchase retry, draft preservation, completion races across child switches, optimistic acknowledgement/rollback and coalesced writes.                                                                  |
| Calendar                             | Month-end navigation, saved edits across windows, school activities, custom early finish, recurrence/exclusive ends, overlap and DST handling, durable refresh/replacement, malformed responses, native late-response protection, endpoint body timeout and Android snapshot validation.      |
| Time Explorer                        | Exact-instant city changes, saved clock/date/city restoration and reset, timezone/DST conversion, leap-year orbit round trips and year boundaries, weather exploration, stale-data rejection/retry, globe lifecycle/recovery and failed texture-load retry.                                   |
| Rewards and tooling                  | Exact spelling-to-LEGO overlay matching, purchase availability, quality-report blocker validation and line-count accounting.                                                                                                                                                                  |

This is a deliberate reduction in breadth, not a claim that line/branch coverage is unchanged. Some narrower assertions have no exact replacement: fixed artwork/layout inventories, two-player read-aloud presentation, picture double-click behavior, internal animation/disposal details, additional preference-storage fallbacks and secondary cache-failure paths. The manifest's retained references identify the remaining protection for each area; they do not claim equivalent coverage of every deleted assertion.

## Integrity and validation

All surviving Vitest case names are a strict subset of the baseline. An AST comparison confirmed that every surviving Vitest and browser test callback is unchanged. No cases were merged, skipped or marked todo; production code and runner configuration were unchanged by this reduction. Earlier production/refactor changes were preserved.

- Vitest: **109/109 passed**, zero skipped.
- Node tooling: **2/2 passed**.
- Browser tests: **9/9 passed** — three scenarios in Chromium, Firefox and WebKit, with zero flaky or skipped results.
- Production offline browser tests: **2/2 passed**.
- Android unit tests: **3/3 passed**, with the test task explicitly rerun.
- Android device tests: both retained and compiled; **not executed**, because no device/emulator was connected.
- Repository lint, formatting, production build and `git diff --check` passed.

Reproduce with `npm test`, `node --test scripts/quality-summary.test.mjs`, `npx playwright test --workers=1 --timeout=60000`, `npm run build`, and `npx playwright test --config playwright.offline.config.ts`. From `android`, run `./gradlew.bat :app:testDebugUnitTest --rerun :app:compileDebugAndroidTestJavaWithJavac` with Android Studio's JBR configured as `JAVA_HOME`.
