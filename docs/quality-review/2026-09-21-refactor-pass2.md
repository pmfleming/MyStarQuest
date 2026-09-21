# Second quality refactor — 21 September 2026

This pass addresses the animation, dashboard, optimistic-update and worker hotspots left by the first review. It also fixes the unbounded backend daily-reset batch identified in that review. The existing calendar artwork, offline persistence and theme assets are retained.

## Measurement

Used ts-react-quality-lens **0.3.0**, commit [`c9e853ffe256cd04c5e6b0e2383615882d3056ae`](https://github.com/pmfleming/ts-react-quality-lens/commit/c9e853ffe256cd04c5e6b0e2383615882d3056ae), reconfirmed as the latest `main` with `git ls-remote`. The frontend baseline was measured immediately before this second pass; the backend baseline is the unchanged final first-pass measurement. Analyzer revision, configuration, dependencies and Git history are unchanged. No findings were suppressed or source roots excluded.

<!-- METRICS -->

| Combined measure                 | Before pass 2 |      After |   Change |
| -------------------------------- | ------------: | ---------: | -------: |
| Application/backend source lines |        30,943 |     30,869 |      -74 |
| Cognitive complexity             |         1,577 |      1,574 |       -3 |
| Cyclomatic complexity            |         2,221 |      2,216 |       -5 |
| Halstead effort                  |    10,604,932 | 10,099,170 | -505,762 |
| AST clone groups                 |             0 |          0 |        0 |
| Locality risk                    |        11,047 |     10,993 |      -54 |
| Leverage risk                    |           380 |        344 |      -36 |
| Typed-lint blockers              |             0 |          0 |        0 |

<!-- END METRICS -->

Complexity and effort sum callable records; source lines sum application/backend file records. Tests, documentation, generated output and dependencies are excluded from source-line totals. Locality and leverage are summed **risk** scores, where lower is better. These are comparison aggregates, not additional official Lens scores. Effort estimates do not measure developer hours or startup time. Zero detected AST clone groups does not prove that all duplication is absent.

The backend effort estimate rises from 156,380 to 160,536 because reset processing now creates and commits bounded batches. Its cognitive complexity falls from 67 to 65 and cyclomatic complexity from 81 to 78. The combined results improve despite that reliability trade-off.

## Changes

- **Star animation:** replaced five overlapping state values with one phase/spawn/count state, shared deterministic star positions and a phase presentation table. Three deadlines replace nested phase callbacks. Artwork, trajectories, easing and foreground phase timing remain the same; interrupted balances cancel their timers. Replay also supports Enter and Space. When a background tab resumes after overdue deadlines, it can advance directly to the elapsed phase rather than replay every delayed phase.
- **Dashboard:** preserved the parsed chore type through ephemeral-state merging, removing impossible test-item editor branches. Single-chore and whole-day reset now share the meal-aware reset decision, and the selected-child lookup is reused for the balance and header.
- **Optimistic updates:** moved snapshot acknowledgment rules into the existing pure state module. Patches remain until all fields are acknowledged; stale failed writes cannot erase newer edits. Settlement clones only when a matching field changes, preserving object identity for unrelated acknowledgments.
- **Shared activity challenge:** reused the existing result-history rule, simplified timer cleanup and removed a callback wrapper and redundant finished-state calculation.
- **Earth worker:** replaced double type assertions with the dedicated-worker scope and a typed response function; the original pixel buffer is still transferred without copying.
- **Backend daily reset:** commits at most 500 writes per batch, in order, and stops after a failed commit. Legacy day aliases use a shared lookup while explicit scheduling toggles retain precedence. Earlier successful batches remain committed if a later batch fails; atomicity is per batch, not across the whole reset.

| Module                                  | Estimated effort before |   After |
| --------------------------------------- | ----------------------: | ------: |
| Star animation                          |                 468,035 | 141,374 |
| Dashboard                               |                 480,060 | 424,003 |
| Activity challenge                      |                 285,812 | 225,105 |
| Coalesced updates plus optimistic state |                 357,689 | 291,149 |

These comparisons include the extracted animation hook and optimistic helpers. Lens does not emit every hook callback as a separate complexity record, so extracting a pure function can expose branches previously hidden in a callback. The tests and structural changes are stronger evidence than a small aggregate complexity movement alone.

## Validation

<!-- VALIDATION -->

- Latest-Lens whole-project gate: **warn**, complete evidence, **0 blockers**, **46 warnings** (down from 49 after the first pass). The configured full Vitest suite passed.
- Application TypeScript/production build, Capacitor sync and backend build passed.
- Android debug assembly and native unit tests passed; final APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Both Chromium production offline tests passed: saved signed-in chore editing offline, and reopening the app offline with sign-in recovery after reconnecting.
- ESLint passed with two existing unused-disable warnings in the offline worker source/generated copy; formatting passed.

<!-- END VALIDATION -->

Regression coverage includes both themes and animation phase deadlines, StrictMode cancellation, zero/large balances, coalesced updates and failed writes, unmount flush, transferable worker output, failed map requests, large backend resets, failed batches and legacy schedule precedence.

## Remaining limits

Large hooks such as `useAnimalSession` remain maintenance hotspots. Existing architecture/accessibility heuristics and the animal-knowledge seed assertion still warrant review; no warning was suppressed to obtain these results. No new first-load benchmark or physical Android device test was performed. Native assembly/unit tests and Chromium offline checks cover the available local environments. The APK was rebuilt, but no device installation or cloud deployment was performed.

The [JSON evidence](2026-09-21-refactor-pass2.json) records per-project values, source hashes and analyzer identities. Generated Lens evidence is in `target/analysis` and `target/functions-analysis`; second-pass baseline/source snapshots and command logs are in the ignored local directory `output/quality-review-pass2`. The [first-pass report](2026-09-21-refactor.md) remains unchanged.
