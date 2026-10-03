# Project review and refactor — parent sharing

## Result

Reviewed the app and Firebase Functions using [ts-react-quality-lens 0.3.0 at 233239b](https://github.com/pmfleming/ts-react-quality-lens/commit/233239b623b67df9c772d7ac3602740fb9de3f12), verified against upstream `main` on 3 October 2026. The tool was fetched, its locked dependencies installed, and its source built locally.

The refactor removes all four detected clone groups, the offline model dependency cycle, and all 38 typed-lint blockers. It also fixes saved families disappearing from the offline child chooser and prevents obsolete membership listeners from restoring a removed child.

| Combined production metric  |     Before |      After |   Change |
| --------------------------- | ---------: | ---------: | -------: |
| TypeScript/TSX source lines |     35,546 |     35,400 |     −146 |
| Cognitive complexity        |      1,924 |      1,836 |      −88 |
| Cyclomatic complexity       |      2,544 |      2,518 |      −26 |
| Estimated Halstead effort   | 11,790,548 | 11,269,140 | −521,408 |
| Locality risk total         |     12,883 |     12,866 |      −17 |
| Leverage risk total         |        828 |        584 |     −244 |
| Detected clone groups       |          4 |          0 |       −4 |
| Typed-lint blockers         |         38 |          0 |      −38 |

**Line-count tradeoff:** production code shrinks by 146 lines. Regression tests and test isolation add 163 lines, so physical source including tests, scripts, CSS, and Android Java grows from **49,391 to 49,408 (+17)**. The requested reduction is achieved for production source; total source including tests is slightly larger.

## Review findings and changes

### Child selection and subscription ownership

The child-access provider subscribed directly to Firestore for owned children. A family saved in the app's durable offline store could therefore produce an empty chooser when Firestore had no corresponding cached query. Owned children now use the existing `useUserCollection` hook, which reads the same offline store as the activity screens. The production browser test verifies selecting the saved child, awarding stars, and retaining the pending change after reload.

Shared membership listeners now have one subscription owner. Removing or replacing an index grant invalidates its callbacks before revoking its cache. A callback from an older membership cannot restore its profile or mark a replacement subscription ready. Invalid grants are excluded from the current subscription set. The existing component regression now exercises membership replacement, delayed callbacks, and removal.

Profile normalization is shared by the access provider and children management, beside the child schema in `data/types.ts`. Both paths apply the same defaults and timestamp conversion. Selection retains the owner namespace, and the access provider supplies its existing default theme.

### Validation and Firestore boundaries

Document validation previously repeated field allowlists, field categories, numeric limits, and nested type checks. A per-collection validator table now places the allowed field and its rule together. Activity validation separates the allowed state keys from timestamp/outcome/value normalization. Server-controlled timestamps, admin-only profile changes, foreign-child rejection, reset permissions, and task-specific state limits remain enforced.

New regression tests exercise forged progress/profile fields, inherited property names, wrong types, numeric limits, and server timestamp normalization. The sharing emulator suite verifies permissions, invitations, revocation, migrations, idempotent writes, shared progress, single-use activities, and mocked email delivery.

Firestore snapshot reads in the sharing service now expose `unknown` field values instead of propagating SDK `any` values. Identifier validation, numeric conversion, and record validation occur at their use sites. Invitation acceptance builds its result once. Callable factories share the repeated scoped list/delete and invitation/member-revocation adapters; each service method retains its authorization checks.

### Offline projection and collection listeners

Shared-progress projection now lives with the offline model operations that consume it. This removes the `model → sharedProgress → model` cycle and reuses the existing receipt-sequence check and record normalization.

Collection listeners share conversion, server-snapshot filtering, and persistence-error handling. Shared child filtering, nested reward paths, membership revocation, and legacy cache retention remain explicit. Cached query results cannot replace the durable collection snapshot. Local persistence and cloud transaction behavior remain separate responsibilities.

### Reuse and smaller public surface

Invitation acceptance, parent management, and test creation share asynchronous busy/error feedback, including a synchronous guard against duplicate submissions. Agenda expansion and reward-image expansion share Enter/Space handling. Parent management retains the requested always-visible image, current-parent list, email box, and invitation button.

Unused task-limit wrappers, obsolete default test-star constants, and an unused sharing-version constant were removed after checking consumers. The remaining task-limit validation is local to its field loop. Date-part extraction indexes the formatter's parts once.

## Validation

- Whole-project app Lens audit: **complete, warn, zero blockers, 57 warnings**. Typed lint, compiler diagnostics, and React Hooks findings are zero. The full unit/component suite passes: **92 tests**.
- Whole-project Functions Lens audit: **complete, pass, zero active findings**. Its config disables test execution; runtime verification is supplied by the separate **13 passing Firestore emulator/service tests**.
- Web and Functions builds, project ESLint, and changed-file formatting checks pass.
- Chromium development scenarios: **2 passing tests**, covering a narrow-phone activity and concurrent offline operations with lost acknowledgements.
- Production offline scenarios: **2 passing tests**, covering saved-family activity writes and offline application-shell/sign-in restoration.
- Quality-summary script tests: **2 passing tests**.

The component tests now mock their unused offline runtime dependency, so the clean-checkout audit does not depend on a local Firebase `.env` file. Browser checks use synthetic local fixtures, and email delivery is mocked. No live invitations were sent and no backend deployment was performed.

## Remaining findings and measurement limits

- The app's 57 warnings comprise 37 layer heuristics, 11 unlisted-dependency findings, and 9 accessibility findings. The root dependency scan includes the separate Functions package; those findings need workspace-aware interpretation. Accessibility findings remain available in the generated report for a focused UI review.
- The Time Explorer orchestration hook, animal-session state, activity actions, calendar lifecycle, and offline enqueue remain larger areas. The service's transactional `apply` method also deserves continued scrutiny: authorization, receipt replay, progress, consumption, and star balance must stay atomic.
- This Lens revision extracts named declarations and variable-bound functions, but omits class methods and anonymous callbacks from standalone hotspot records. The service transaction was therefore reviewed manually and exercised with the emulator; the hotspot totals do not establish that every complex function has been measured.
- Complexity and effort totals sum callable records. Halstead effort is an estimate, and enclosing/nested callable records can overlap. Module risk totals are comparison aids, not official project-wide grades. Lower totals do not establish a runtime speedup or measured test coverage.
- Individual areas trade off differently: frontend cognitive complexity rises by 3 while Functions falls by 91. Functions estimated effort rises by 15,336 while frontend effort falls by 536,745. The combined figures above include both sides of those changes.
- Locality improves modestly. One intermediate result treated a local callback named `publish` as an event bus; its final name, `updateChoices`, describes its actual role. No global event bus was introduced or removed. The baseline/final figures also reflect module count, dependency paths, and Git history.
- Vite still reports the existing large-chunk warning. Android native code was unchanged and native/device suites were not rerun for this refactor.

## Evidence and reproduction

The baseline includes the pending Parents UI edits and uses the same tool revision and measurement configurations as the final run. No policy thresholds, source exclusions, or suppressions were relaxed. Whole-project audits ran in source snapshots with the same Git history and linked installed dependencies, without an `origin/main` default audit base.

- [Machine-readable comparison](2026-10-03-sharing-refactor.json)
- [App audit](../../target/analysis/audit.json) and [Functions audit](../../target/functions-analysis/audit.json)
- Raw baseline artifacts, source archive, pending UI patch, final source snapshot, audit scripts, and validation logs: `output/quality-sharing-review/` (local, ignored).

The local reproduction script is `node output/quality-sharing-review/audit-verified.mjs` (it intentionally refuses to overwrite its existing snapshot). Individual measurements use `node tmp/quality-lens-latest/dist/bin/ts-react-quality-lens.js measure all --config ts-react-quality-lens.config.json`, and the corresponding Functions configuration. Run `npm run test:sharing` with the Android Studio JDK available for the emulator.
