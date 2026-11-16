# Five quality follow-ups — 16 November 2026

These changes follow the same-day Lens review. Existing uncommitted work was preserved and excluded from the five commits. Each improvement was validated before its commit. The installed Lens revision is `8e8349c19fa22b1971bca3689d2712b5fdeebcd0`; no measurement policy was relaxed.

## 1. Weather request ownership on disconnect

Going offline aborted the request but left it registered until its promise settled. A same-turn reconnect therefore skipped fetching, and the cancelled request could replace the useful offline message with a generic failure. A shared cancellation operation now releases request ownership before aborting, clears the loading state, and permits immediate retry. Unsubscription uses the same operation. Old responses cannot update the cache or current state.

Validation: weather store/data tests, **5 passed**. New regressions cover both an immediate reconnect and a reconnect after cancellation settles, including an old response arriving after the replacement request.
