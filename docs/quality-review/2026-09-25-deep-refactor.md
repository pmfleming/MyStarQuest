# Whole-project quality review and refactor

Reviewed 25 September 2026 using the latest `main` of [ts-react-quality-lens](https://github.com/pmfleming/ts-react-quality-lens/tree/c9e853ffe256cd04c5e6b0e2383615882d3056ae): version **0.3.0**, commit **c9e853ffe256cd04c5e6b0e2383615882d3056ae**. The existing local checkout was fetched, checked out at `origin/main`, and rebuilt. The CI pin already matches this commit.

The review covered the frontend and Cloud Functions with separate full-project audits. Manual inspection included shared controls, activity renderers, data hooks, offline transactions and replay, weather/calendar lifecycle code, build/quality scripts, and Android calendar integration. TypeScript Lens does not measure Java: Android findings are manual observations, not part of the scores below.

## Results

| Measure                            | Starting baseline |      Final |           Change |
| ---------------------------------- | ----------------: | ---------: | ---------------: |
| Production source lines            |            32,339 |     32,096 |             −243 |
| Cognitive complexity               |             1,565 |      1,530 |              −35 |
| Cyclomatic complexity              |             2,229 |      2,195 |              −34 |
| Halstead effort                    |        10,443,796 | 10,211,071 | −232,725 (−2.2%) |
| Leverage risk                      |               284 |        248 |     −36 (−12.7%) |
| Locality risk                      |            12,078 |     12,078 |        Unchanged |
| Detected clone groups              |                 0 |          0 |        Unchanged |
| Frontend internal dependency links |             1,133 |      1,118 |              −15 |
| Frontend external dependency links |               181 |        178 |               −3 |
| Dependency cycles                  |                 0 |          0 |        Unchanged |

Physical code counting across `src`, `functions/src`, `tests`, and `scripts` confirms **244 fewer lines total**: 243 production lines and one fixture line. No tests were added or removed. Generated reports and documentation are excluded from these code totals.

The frontend audit is complete with **zero blockers and 51 warnings**, the same warning count as the baseline. High-risk findings decreased from 308 to 301. The Functions audit passes with zero blockers or warnings. No rules, thresholds, exclusions, or suppressions were changed.

## Refactors

1. **Removed an unreachable management UI.** Every caller of `createUnifiedChoreDescriptor` used the daily view. Chore editing already goes through `ChoreCreationFlow`. Removed the dormant `manage` mode, its draft-title and schedule callback surface, its separate image/repeat/star controls, and its dinner-settings persistence handlers. Current creation/editing controls remain in their existing form. The daily dinner renderer now only supplies the properties needed for playback and completion; setup callbacks are optional in `DinnerCountdown`.
2. **Removed unused reward editing state.** No caller used `useRewards`' title drafts or update methods. Removed their optimistic update queue, draft backfill hook, and unused update type. Reward subscription, creation, purchase, and deletion remain. Child profile drafts and their validation remain because they have live consumers.
3. **Centralized document deletion.** Chore, child, and reward deletion now share `deleteUserDocument` beside the existing document creation/update functions. It retains the durable offline path and Firestore fallback. Callers still own their domain cleanup, such as clearing the active child or pending title update.
4. **Separated celebration presentation from reward catalogs.** `RewardCelebration` receives its main image and optional overlay. `RewardsPage` resolves reward artwork, including the LEGO spelling overlay; task celebrations provide task artwork as before. The generic animation no longer imports the rewards/spelling catalog. Animation timing, reduced-motion behavior, colors, sizing, and gift fallback are retained.
5. **Simplified local decisions.** Keyboard navigation uses a local key-to-target map; spelling feedback keeps each state's color, shadow, and animation together. Shared chore rendering uses the existing illustrated-theme predicate instead of repeating the two-theme checks. Calendar generation processes the original event and recurring occurrences through one append path, preserving duration and date-boundary handling.
6. **Strengthened existing component types.** Agenda and learning-navigation CSS custom properties now use checked style types rather than assertions. The menu effect checks its dialog ref before use. These changes account for the leverage-risk reduction; they do not change rendered styles.

## Review conclusions and remaining priorities

**Locality improved structurally, but its aggregate Lens score did not fall.** Unused renderer dependencies and cross-domain artwork lookup were removed, and repeated persistence decisions now have one owner. Lens locality also incorporates deep import paths, direct test associations, historical defects, and co-change history. Those inputs remain largely unchanged. The score is reported without claiming a numerical improvement or renaming modules/adding tests merely to lower it.

**Cloning was already zero at the configured detection threshold.** The deleted management UI and repeated deletion/theme decisions are duplication below that threshold. The line and dependency reductions demonstrate the change; the clone metric cannot decrease below zero.

**The highest remaining hotspots need behavioral care.** `StandardActionList.ActionCard` remains at cognitive complexity 20; `FractionsTester` is 16; the offline boundary is 15; weather scene selection and offline operation projection/enqueue are 14. Card confirmation/focus, quiz transitions, and offline sequencing carry useful behavior. Splitting them solely to lower a per-function score would add indirection and often increase total code. Their remaining risk is documented rather than hidden with exclusions. Current shared-control browser coverage passes.

**Offline and calendar failure contracts should stay explicit.** The inspected offline transport keeps receipts and business writes atomic; retries retain operation identity, and lost local acknowledgements can replay safely. Weather and calendar stores have different expiry, native bridge, cancellation, and stale-data rules, so merging them into a generic cache would obscure those contracts. School-calendar exclusive ends and DST-aware iteration remain intact. Android's calendar repository retains its synchronized refresh, bounded response size, deadline, durable save, and bundled fallback.

**Cleanup findings need context.** The 28 cleanup records include HTML-loaded browser fixtures, deployment exports, separate Functions dependencies, migration/artwork scripts, and internal schema/type exports. Browser fixture and Firebase entrypoint references are not all visible to the root import graph. No blanket deletion or suppression was applied. Dependency analysis still reports 36 layer violations and 159 deep relative imports, with no cycles. Those are remaining architectural review items, not new findings introduced by this refactor.

**Coverage and runtime limits remain explicit.** Lens reports suite execution, not measured coverage, in this configuration. Runtime inputs are not configured and publishable-package analysis is disabled for this application. This review does not claim runtime speedups or new Android device measurements; the separate performance review contains the device evidence.

## Validation

- Full frontend Lens audit, including the configured Vitest suite: all 114 tests pass, zero blockers. Test count is unchanged by this refactor.
- Full Functions Lens audit: pass, zero blockers or warnings.
- Root ESLint and Prettier checks: pass.
- Web production build/type check and Functions TypeScript build: pass.
- Existing fractions Playwright test against a production-built fixture: pass in Chromium at 320 × 800, including touch-target sizes, horizontal fit, answer progression, and completion. Active/completed screenshots were inspected.
- `git diff --check`: pass.

The initial development-server browser attempts were interrupted by startup delay and repeated Vite reconnections. The same unmodified test passed against a production-built fixture. No product behavior or test assertions were weakened to obtain that pass. Existing large-chunk build warnings remain.

## Reproducibility

The baseline was a fresh snapshot of the working tree at the start of this review, including all earlier user changes. Both runs used the same Lens commit and configurations, with an empty base and `gate: all` to avoid narrowing the audit to changed lines. Frontend and Functions results are separate in [the machine-readable comparison](2026-09-25-deep-refactor.json).

Complexity and effort sum callable records; source lines sum file records; locality and leverage sum module risk scores, where lower is better. These aggregates are comparison aids, not additional official Lens scores. The JSON also records physical line deltas and before/after content hashes for every changed source file. Local baseline/final artifacts and screenshots are under `output/quality-review-2026-09-25-deep`; final audit artifacts are in `target/analysis` and `target/functions-analysis`.
