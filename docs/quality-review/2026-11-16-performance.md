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

## 4. Suspend inactive countdown rendering

Retained inactive activity tabs use deadline timers instead of 250 ms visual ticks. Expiry still persists once; returning to the tab catches up immediately. Hidden browser documents retain the existing resume behavior. Timers stop after the final deadline.

Validation: both component lifecycle tests passed, including no renders during eight inactive seconds and expiry while the activity tab remains inactive.

## 5. Cache WebGL scene targets

Orbit positions, focus longitude, lighting targets, mode visibility, and camera targets now update on scene-input or drag changes. Frame callbacks retain interpolation and animated pings. This removes duplicate focus searches and static trigonometry without reducing animation cadence.

Validation: a 120-frame test records one focus calculation rather than two per frame and verifies lighting/orbit targets across mode changes; TypeScript passed.

## 6. Coalesce agenda title layout work

Resize bursts schedule one animation-frame measurement. Unchanged width/font signatures skip fitting, width-only changes reuse natural text width, and font changes invalidate that measurement. Pending frames and font listeners are cleaned up on unmount.

Validation: the component test covers 20 resize notifications coalescing into one frame, unchanged-width skips, width-only reuse, changed fonts, expansion, and cleanup.

## 7. Skip identical backend reset writes

Daily and manual legacy resets now compute each patch once and batch only documents whose stored fields differ. Missing fields still receive their defaults. Return counts reflect actual writes; 500-write limits and stop-on-failure behavior remain.

Validation: integration-style handler tests cover already-reset dinner/water/standard chores, missing defaults, changed fields, 1,001 writes in three batches, and batch failure. Functions build passed.
