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
