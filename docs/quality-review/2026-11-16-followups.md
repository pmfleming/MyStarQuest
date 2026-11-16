# Five quality follow-ups — 16 November 2026

These changes follow the same-day Lens review. Existing uncommitted work was preserved and excluded from the five commits. Each improvement was validated before its commit. The installed Lens revision is `8e8349c19fa22b1971bca3689d2712b5fdeebcd0`; no measurement policy was relaxed.

## 1. Weather request ownership on disconnect

Going offline aborted the request but left it registered until its promise settled. A same-turn reconnect therefore skipped fetching, and the cancelled request could replace the useful offline message with a generic failure. A shared cancellation operation now releases request ownership before aborting, clears the loading state, and permits immediate retry. Unsubscription uses the same operation. Old responses cannot update the cache or current state.

Validation: weather store/data tests, **5 passed**. New regressions cover both an immediate reconnect and a reconnect after cancellation settles, including an old response arriving after the replacement request.

## 2. Offline connection ownership and failure cleanup

Shared runtimes now track individual subscriber tokens instead of a mutable counter. Cleanup is idempotent: a repeated unsubscribe cannot disconnect another consumer or corrupt the next connection. A failed setup drains already-installed listeners, synchronization, and broadcast resources before reporting the error. Revocation persistence failures are also routed to the existing error store instead of becoming unhandled rejections.

Validation: runtime/recovery tests, **6 passed**. New cases cover two consumers, duplicate cleanup, reconnect ownership, and a setup failure after earlier subscriptions have been installed.

## 3. Resolve and validate task completion once

The star-award transaction now resolves the stored/default task once. Ownership, completion detection, creation, and event metadata use that record instead of repeatedly probing the Firestore snapshot and reconstructing fallbacks. Crucially, default task creation now receives the same child-ownership check as an existing task; invalid defaults cannot create a cross-child task while awarding stars to the selected child. Existing stored metadata takes precedence over defaults.

Validation: star transaction tests, **6 passed**. Coverage includes concurrent deduplication, same-day reset, next-day attempts, wrong-child stored/default tasks, missing tasks, consumed-task history, penalty clamping, and authoritative reward pricing.

## 4. Separate weather composition from condition rendering

WeatherScene now composes the environment, condition layer, character, precipitation, and wind. The condition layer owns sunlight/moonlight, clouds, lightning, and ground effects. Cloud placement is a complete level-to-layout table, removing repeated rendering branches while keeping the exact coordinates and drawing order. Existing artwork and accessibility labels are preserved.

Validation: weather component/data tests, **3 passed**; **3,072** before/after server-rendered combinations matched exactly after normalizing generated clip-path IDs. The combinations cover both themes, availability, day/night, every cloud/precipitation/intensity/wind value, and representative fog/thunder flags.

Lens: the former 31-point WeatherScene callable is now 12, with the condition layer at 14. The complete module falls from cognitive 43 to 38, cyclomatic 46 to 43, and 334 to 329 lines. Estimated effort rises from 107,950 to 139,625; this is a readability/ownership improvement with a measured effort tradeoff, not a claim that every metric decreases.

## 5. Keep child selection stable during menu actions

Child-switch buttons now follow the same pending-action guard as reset, sign-out, navigation, and dismiss controls. A parent cannot switch the selected child's scope while a reset or sign-out is still running. After failure, the menu remains open with its error and restores child switching.

Validation: AppMenu tests, **3 passed**. The new reset/sign-out cases verify blocked selection and dismissal during the operation, then successful selection and navigation after rejection. The existing StrictMode and reset-retry case remains green.

## Combined validation and measured tradeoffs

The final whole-project frontend Lens audit is complete: **0 blockers, 71 warnings**, with no new warnings relative to the follow-up baseline. Its configured full Vitest execution passed. Compiler diagnostics are zero; the two existing clone groups remain. `npm run lint`, `npm run build`, formatting checks, and staged diff checks passed. Vite retains its existing large-chunk warning.

Across the five changed production modules, cognitive complexity falls **200 → 193** and cyclomatic complexity **263 → 260**. Source grows **1,293 → 1,296 lines**, and estimated effort rises **480,629 → 495,108**. The request was prioritized around concrete lifecycle/ownership failures and clearer rendering responsibilities; these are not five across-the-board metric reductions. Regression tests add coverage and code. [Detailed measurements](2026-11-16-followups.json) include per-module results.

Existing uncommitted files were checked against the initial SHA-256 inventory and remain byte-identical. They are outside these five commits. Local audit exports, render-comparison evidence, preservation checks, and validation logs are under `output/quality-followups-2026-11-16/`. Validation ran on the installed Node 24.11/npm 11.7 toolchain; no deployment or push was performed.
