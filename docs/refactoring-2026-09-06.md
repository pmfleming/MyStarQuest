# Source-led refactoring — 6 September 2026

This pass reviewed the application UI, activity state, persistence hooks,
asset handling, calendar and 3D code, Cloud Functions, and supporting project
structure directly from source. The final assessment does not use the quality
analyzer or its saved reports. Generated analysis changes were reverted.

The refactor changes 27 production modules:

- Activity IDs and check requests now use task-type keys. Adding a test no
  longer requires another state hook, setter, dependency property, and wiring
  map in each consumer. Starting an activity still clears the preceding one;
  cancelling dinner only clears dinner.
- A typed test-rendering table replaces the repeated task/todo switches.
  Defaults, editable problem counts, math difficulty, completion, failure mode,
  and legacy read-only daily tests retain their behavior. Rendering uses the
  existing completion and outcome rules.
- Default test records and persisted test documents use the same templates.
  Chore type guards share one predicate, including dashboard edit checks.
- Children, chores, and rewards share optimistic-item reconciliation and
  memoized merging. Their persistence and rollback behavior is unchanged.
- Arithmetic problems and large-number answers keep related values together
  in state, removing repeated setter sequences and temporary objects.
- Spelling uses the existing asset catalog, including its Pokémon spelling
  correction. Calendar and schedule controls use one season-image table.
- Initial 3D month labels and replacement labels share construction logic.
  Existing disposal tests verify that replacement still releases old resources.
- School-calendar event expansion is a pure module separate from the HTTP
  handler. Initial and recurring occurrences share date-range processing;
  duplicate summaries, all-day flags, Amsterdam dates, exclusive end dates,
  and the existing 24-hour stepping rule are preserved. Server activity-type
  precedence is expressed in one ordered table, and query results are filtered
  without an unnecessary deduplication map.

## Size comparison

Baseline commit: `4bc1aae14c3a7c70fc423b81f5eac51843032015`.
Counts include physical TypeScript/TSX lines, comments, and blank lines in
changed and newly added files. Unchanged files cancel out of the net reduction.
Documentation, generated files, and assets are excluded.

| Scope                  | Before | After | Net change |
| ---------------------- | -----: | ----: | ---------: |
| Production, 27 modules |  6,827 | 6,349 |       −478 |
| Tests, 6 modules       |    592 |   858 |       +266 |
| Production plus tests  |  7,419 | 7,207 |   **−212** |

The production reduction is 7.0% across the affected modules. Complexity and
effort are addressed by removing repeated branches, setter sequences, and
duplicated construction. Reuse and locality improve by keeping each shared rule
in one place. Numerical cognitive, cyclomatic, effort, clone, leverage, and
locality scores should be measured with the updated analyzer when available;
no score or percentage is inferred from the old reports.

## Verification

- Vitest: **187 tests pass across 44 suites**; the baseline had 170 passing tests.
- Playwright: **3 smoke tests pass**, covering Chromium, Firefox, and WebKit.
- Frontend type checking and production bundling pass.
- Cloud Functions compile successfully.
- ESLint over `src`, `tests`, and `functions/src`: no errors; eight existing
  Fast Refresh warnings in the unchanged `presetChoreRenderers.tsx` module.
- Changed-file formatting and `git diff --check` pass.

New regression coverage exercises every test renderer and its editable/read-only
behavior, task-type switching, batched and isolated check requests, template
round-tripping, and calendar recurrence and overlap handling.
