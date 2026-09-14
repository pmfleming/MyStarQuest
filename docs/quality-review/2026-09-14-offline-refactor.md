# Quality review and offline refactor — 14 September 2026

The refactor improves every requested aggregate measure. Production TypeScript/JavaScript is **308 physical lines shorter**, and production plus tests is **226 lines shorter**, after adding 82 lines of regression tests. The largest callable cognitive complexity falls from **35 to 22**. The work preserves independent completions on different devices, replay protection for the same queued action, and a zero minimum star balance without carrying debt into later earnings.

## Scope and method

Reviewed the application's 214 baseline source modules and the two Cloud Functions modules using **ts-react-quality-lens 0.3.0**, revision [`986c6fd9cc82627866156ba0cf22cb1504ab8587`](https://github.com/pmfleming/ts-react-quality-lens/commit/986c6fd9cc82627866156ba0cf22cb1504ab8587). Remote `main` was verified at both the start and end of the review; this was already the repository's pinned revision. Its checkout was rebuilt before analysis.

The baseline is a fresh measurement of commit `28c90c7fddd77275e534d276514e17f00b7ca184`, which includes the preceding offline implementation. Both measurements use the same Lens version, configurations, exclusions, and Git history. No suppressions or analysis configuration changes were introduced. Review covered complexity, cloning, dependencies, locality, leverage, type/lint, React, correctness, and cleanup evidence, followed by manual tracing of candidate changes and their tests.

The [machine-readable report](2026-09-14-offline-refactor.json) preserves metrics, provenance, analysis identities, changed-module results, architecture signals, and validation. Final raw evidence is in [frontend analysis](../../target/analysis/hotspots.json) and [Functions analysis](../../target/functions-analysis/hotspots.json). The standard `target/analysis/quality-comparison.*` compares against previously committed artifacts; this report instead uses the fresh baseline described above.

## Measured results

Lower is better for each row. Complexity and Halstead effort sum callable measurements; source lines sum file measurements. Locality and leverage sum module risk scores. These are comparison aggregates, not official project-wide Lens scores. Halstead effort is a static estimate, not measured developer time.

| Application measure   |    Before |     After |          Change |
| --------------------- | --------: | --------: | --------------: |
| Source lines          |    28,253 |    27,946 |            −307 |
| Cognitive complexity  |     1,466 |     1,390 |      −76 (5.2%) |
| Cyclomatic complexity |     2,016 |     1,971 |      −45 (2.2%) |
| Halstead effort       | 9,802,750 | 9,661,435 | −141,315 (1.4%) |
| Clone groups          |         4 |         1 |        −3 (75%) |
| Locality risk         |     9,652 |     9,634 |      −18 (0.2%) |
| Leverage risk         |       784 |       580 |    −204 (26.0%) |
| Typed-lint blockers   |         2 |         0 |              −2 |

The physical source-line decrease differs by one from Lens because a new helper file changes the file-line accounting. Counts include authored code under `src`, `functions/src`, and `tests`; generated artifacts, documentation, and assets are excluded. Other authored code and configuration were unchanged.

Cloud Functions metrics are unchanged: 421 source lines, cognitive complexity 47, cyclomatic complexity 57, effort 94,525, zero clones, locality risk 36, leverage risk zero, and zero typed-lint blockers. The backend was reviewed and rebuilt; this refactor changes application code.

## Findings addressed

1. **Offline delivery mixed transaction policy with mutation details.** `applyOperation` now owns receipt lookup and atomic dispatch; document and activity handlers own their respective writes. Shared helpers define star deltas, balance clamping, activity merging, and revision selection. Both projection and delivery use these rules. Transactions still read before writing, and the receipt remains atomic with the business changes.
2. **Offline store and sync duplicated observable-state mechanics and receipt reconciliation.** A small typed `snapshotStore` supplies stable snapshots and subscriptions. Acknowledgement now belongs to `OfflineStore`, keeping authoritative document reconciliation and queue removal within one durable mutation. The helper has a direct behavioral test for notification order, unchanged snapshots, and unsubscribe.
3. **Storage boundaries trusted unchecked values.** Durable state and queued actions now have Zod-derived types and validation; saved receipts are validated before use. Malformed durable state rejects without replacing the saved queue. Firebase conversion recognizes SDK `Timestamp` instances instead of invoking an arbitrary `Function`. This removes both typed-lint blockers.
4. **Default-test creation and completion could commit separately.** Native completion now creates the definition and queues its award within one local mutation. A failed write cannot leave a half-completed operation. It also rejects a task belonging to a different child. Regression tests cover both new and existing definitions on disk failure and stale ownership.
5. **Task parsing reconstructed fields through unsafe string-key assertions.** The parser now keeps each discriminator and its fields together, using defaults already supplied by validation. Existing aliases, custom titles, reset values, and optional history remain supported. Timestamp validation now rejects a present non-callable `toDate`; tests preserve adapters that depend on their original `this` receiver.
6. **The client retained an unreachable daily-todo rendering model.** Runtime producers and descriptor callers use `TaskWithEphemeral`; none produce the old `TodoRecord` shape. Removed its unused types, renderer branches, callback fields, and trivial wrappers. Backend migration/reset code and stored documents remain intact, as do legacy snapshot field aliases. Tests continue to exercise active chore/test rendering and management behavior.
7. **Weather freshness and city keys were repeated.** Cache and store now share the city-key function. Refresh uses one freshness helper and early returns for superseded requests; its callable cognitive score falls from 21 to 15. Existing cancellation, retry, stale data, and day-rollover tests remain in place.

Unnecessary runtime copies were also removed from record access and unchanged task-title reconciliation. The full offline draft clone remains necessary to isolate a failed durable write from the currently visible state.

## Architecture interpretation

Locality improves modestly: direct behavioral tests reduce the missing-test-evidence penalties for offline actions and Firebase conversion by 18 each. The generic event-bus heuristic adds 18 to runtime after use of `errors.publish`, producing a net reduction of 18. This does not demonstrate a reduction in historical co-change coupling or substitute for coverage.

Leverage risk improves through inferred schema types, narrower collection APIs, proper type guards, and removal of unchecked assertions and dead adapters. The new observable helper shares actual behavior across store, sync, and runtime. No files were relocated to manufacture test locality.

Internal dependency edges increase from 965 to 968, external import edges from 156 to 158, and heuristic layer violations from 30 to 33. The additional shared-state imports cross the tool's inferred offline/library boundary; they are explicit dependencies on a dependency-free primitive. Both projects remain cycle-free. These tradeoffs are retained rather than hidden with suppressions.

High-risk hotspot records fall from 148 to 145. The React analysis is unchanged at 28 high-risk component records, zero hook-lint findings, and nine accessibility findings. The remaining clone is symmetric event-listener setup/cleanup in `AppErrorBoundary`; preserving lifecycle symmetry is preferable to extracting it solely to change a score.

## Validation

- Full configured Vitest suite passed through the Lens audit. Its result is suite-level evidence, not per-test coverage. Focused offline, parser, weather, and renderer regressions also passed during the refactor.
- All six Playwright checks passed across Chromium, Firefox, and WebKit, covering login smoke behavior and real IndexedDB offline persistence/recovery.
- ESLint, TypeScript application build, Vite production build, Cloud Functions build, Capacitor Android sync, and Android `assembleDebug` passed. The existing large-chunk build warning remains.
- The final configured quality gate completed with zero blocking findings and five active warnings (verdict `warn`): four inferred layer boundaries and the root analyzer's unlisted dependency warning for a nested Functions test import. The Functions package supplies that dependency. No findings were suppressed.

The Android package was built but not installed or exercised on a physical phone during this review. Browser offline checks and mocked Firebase transaction tests do not replace live multi-device Firestore integration. The Functions-specific configuration has no standalone test command; mocked backend handler tests execute in the root suite. No coverage, mutation-testing, runtime profiling, or runtime accessibility claims are made.

## Remaining review priorities

1. **Calendar timeout, `functions/src/index.ts:286`:** the timer is cleared after response headers, before body consumption, and is not cleared in `finally` on failure. A stalled body can outlive the intended timeout. Cover rejection cleanup and slow-body behavior before revising the request lifecycle.
2. **Accessibility:** nine existing findings remain around mouse-driven countdown interactions and controls in `LearningNavigation`, `TrainingPhotoPortrait`, `DragScrollRegion`, and `StarInfoBox`. Address keyboard behavior and semantics with interaction tests.
3. **Complex interactive components:** the largest remaining callable cognitive scores are `FactCard` (22) and `ActionCard` (19). Their pending, reset, and answer transitions merit focused behavioral tests before another restructuring pass.
4. **Backend recovery:** reset batching still lacks chunking and per-child failure isolation; dinner input validation remains a separate hardening opportunity. These require explicit persistence and recovery behavior tests.
5. **Offline integration:** verify cold start, account switching, server snapshot/receipt races, and simultaneous spending on two physical devices against a test Firebase project. Existing local tests exercise protocol rules, but do not establish SDK or device-level reliability.

## Reproduction

Install both package trees with `npm ci` and `npm ci --prefix functions`. Build the stated Lens checkout with `npm run build --prefix tmp/quality-lens-latest`. Run `node scripts/quality-gate.mjs 28c90c7`, `npm run lint`, `npm run build`, `npm run build --prefix functions`, and `npm run test:e2e -- --workers=1 --reporter=line`. For the native package, run `npx cap sync android` and `android/gradlew.bat -p android assembleDebug` with the Android Studio JBR configured as `JAVA_HOME`.

To reproduce fresh deltas, measure `map.architecture` separately at the baseline commit and the refactored tree using the stated Lens and unchanged root/Functions configurations. Preserve the same pre-refactor Git history when comparing locality, since subsequent commits change historical signals.
