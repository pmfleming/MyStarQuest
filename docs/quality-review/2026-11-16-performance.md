# Performance implementations — 16 November 2026

Eight independently committed changes address the performance audit. Earlier uncommitted work is excluded from these commits.

## 1. Reuse date/time formatters

A bounded timezone formatter cache replaces per-event formatter construction. History's fallback date lookup now computes only the date key. Locale output, midnight rollover, and DST behavior are preserved. Validation: 27 date/history tests passed.

## 2. Suppress no-op persistence and snapshot work

Unchanged authoritative merges now skip IndexedDB puts and broadcast commits. Structural sharing preserves unchanged read-model inputs and still publishes newer data written by another tab. Query listeners process document deltas after the first server snapshot and ignore metadata-only updates. Strict durability and atomic cross-tab queue updates remain intact.

Validation: offline suites passed (22 cases across the targeted files); TypeScript passed. In isolated Chromium, 20 unchanged merges now produce **0 puts and 0 notifications**, previously 20 each. Transaction read/validation remains, so this does not claim lower isolated merge latency. The formatter implementation reduced the same synthetic 1,000/5,000-entry history builds to roughly 2.6/12.6 ms in this run.

## 3. Share day checks and cache collection projections

All subscribers share one minute-level day-boundary check, suspended while the document is hidden. Only chores and tests subscribe; unchanged dates publish nothing. Collection projections retain identity until their relevant inputs change, preventing unrelated history updates from rebuilding active lists.

Validation: eight targeted timer, projection, runtime, and calendar-hook tests passed; TypeScript passed.
