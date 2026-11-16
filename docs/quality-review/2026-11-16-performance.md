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

## 8. Bound history loading and release inactive runtimes

History listeners now exist only while a calendar reader needs them and query the selected month (with adjacent week/timezone coverage), or the selected year. Navigating within a month reuses listeners; changing periods replaces them. Four bounded ranges cover numeric timestamps, Firestore timestamps, occurrence times from delayed offline delivery, and legacy date keys. Migrated copies remain deduplicated. This trades extra small queries for avoiding a lifetime history download; very small accounts may not see an I/O reduction.

Durable history retains the recent 90 days and each collection's last fetched period. Older recognised event payloads are pruned without deleting cloud records or pending operations. A compact redeemed-reward ledger preserves legacy one-time reward reconciliation. Fresh installations query only currently relevant one-time reward IDs and stop those listeners once redemption is established. Undated legacy payloads are preserved rather than silently discarded. Offline readers flag uncached periods, and mounted readers keep their period if another tab replaces the disk cache. Revocation clears that retained data.

Runtime lookup uses weak references, with strong ownership only for connected runtimes. Unreferenced inactive stores and projection caches can be collected; IndexedDB data and pending work remain durable. Collection subscription lifecycle handling now lives together in `subscribeCollection.ts`.

Validation: targeted tests cover pruning 10,000 old payloads, pending-operation survival and restart, reward reconciliation on fresh installs, period switching, listener cleanup, cross-tab cache replacement, and revocation. Firestore emulator tests verify mixed date formats, delayed events, migration deduplication, and shared-child security rules.

Deployment prerequisite: deploy the indexes in `firestore.indexes.json` and wait for readiness before releasing the app (`firebase deploy --only firestore:indexes` against the intended project). No deployment was performed. The emulator validates query/rule behavior but does not validate production index build readiness.

## Final validation and limits

- Full unit/component run: **264 passed across 88 files**, followed by **8 passing targeted tests** after the final reconciliation cleanup and additional period-navigation regression.
- Firestore emulator: **15 passed**.
- Chromium: **3 passed**, covering both calendar themes and concurrent offline operations through reload/lost acknowledgement.
- Full ESLint, application production build, TypeScript, and Functions build passed. The production build retains its existing large-chunk warning.
- Measurements are synthetic local checks, not production telemetry or mobile battery measurements. Raw timing evidence is in `output/performance-implementation-2026-11-16/benchmarks/measurements.json`; validation logs are in `tmp/perf-*.log`.
