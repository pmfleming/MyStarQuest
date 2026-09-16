# Test reduction — 16 September 2026

Reduced the current working-tree suite from **177 to 119 runnable cases**: **58 removed**, retaining **67.23%**. The nearest whole-test target is `round(177 × 0.67) = 119`; this is a **32.77% reduction**. Exact 67% would be 118.59 tests.

| Runner                                         |  Before |   After | Removed |
| ---------------------------------------------- | ------: | ------: | ------: |
| Vitest                                         |     168 |     110 |      58 |
| Node quality checks                            |       3 |       3 |       0 |
| Playwright across Chromium, Firefox and WebKit |       6 |       6 |       0 |
| **Total**                                      | **177** | **119** |  **58** |

The baseline is the working tree at the start of this request, after the Lens-guided refactor and earlier dinosaur/chore work. A fresh baseline Vitest run passed all 168 tests. Counts include expanded parameterized rows and each configured browser project, following the repository's previous reduction reports. Vitest files decrease from 61 to 51. Assertions, helpers and describe blocks are not counted.

The [machine-readable removal log](2026-09-16-test-reduction.json) lists all 58 removed cases, retained cases per affected file, rationales, runner counts and before/after test-file hashes. Production source, assets, dependencies, runner configuration, browser projects and discovery rules are unchanged. No tests were skipped, hidden, marked todo or combined into large scenarios to lower the count.

## What was removed

- **Repeated variants:** Animals/Insects executions of the common portrait gesture path; Princess repetitions of dinosaur hidden abilities and water/toilet controls; the extra insect hard-game and large-number complete-round variants. The distinct switching/no-alternate-picture gesture branches, generic hidden abilities and actual game progression remain.
- **Presentation and implementation policy:** celebration image/DOM/background identity, one-time reward card positioning, completed water/toilet filenames, exact dinosaur asset-set sizes, cache promise/buffer identity, rendering resolution/mipmap choices, subscription/write-count timing, weather URL options, and exact random-seed difficulty maxima.
- **Overlapping workflows:** lower-level activity-map/state-merge/coalesced-write tests already exercised by reset and synchronization flows; repeated expiry guards, reset sequences, duplicate completion callbacks, and shared save/retry or celebration wiring.
- **Repetitive helper examples:** extra season/date/schedule-label fixtures, calendar metadata/weekend examples, low-level precipitation lookup matrices and the additional calendar cancellation timing case.

Removed unused imports, helpers and branches. The retained keyboard-navigation test also retains Escape cancellation and focus restoration from the deleted recentering scenario. Its layout-position assertions were discarded. No unrelated scenarios were bundled.

## Essential protection retained

- **Offline correctness:** independent device actions, exactly-once replay after lost responses, durable acknowledgements, ordered queues, account isolation, damaged persisted data, storage failure recovery, authoritative versus partial snapshots, deleted-child/definition conflicts and real IndexedDB reload behavior in three browsers.
- **Stars, rewards and authorization:** positive/zero/negative chore scores, zero-floor deductions, stored reward prices, concurrent duplicate completion, same-day reset and next-day awards, built-in test creation, one-time consumption, backend authentication/input/ownership rejection and refusal to deliver another account's actions.
- **Failure recovery:** draft preservation and duplicate blocking during reward saves, rejected purchases, failed automatic outcome saves, failed deletion, reset rollback/retry and disk-write atomicity.
- **Activities and learning:** final-answer completion, mistakes and unlimited-retry mode, queued-result cancellation, final-bite/reset races, catalog integrity and photo credits, dinosaur periods and hard-mode images, hidden answers, clue/picture zoom and keyboard navigation.
- **Availability and lifecycle:** failed collection downloads, stale selection responses, failed-tab navigation, pending-child changes, worker failure/timeout recovery, owned scene-resource disposal, scene teardown, drag cancellation, weather city isolation and local-midnight refresh, calendar outage fallback and invalid cached/network data.
- **Quality gates:** rejection of incomplete evidence and newly introduced floating promises remains tested against the pinned Lens revision.

This is a behavioral review, not a claim of unchanged measured line or branch coverage. Fewer theme/mode combinations are exercised directly. Exact UI temperature limits and progression maxima, warm weather-cache reloads, worker-unavailable successful fallback, per-page retry wiring, calendar cancellation after response-body arrival, and scheduled malformed-title policy have less direct coverage. The retained broader flows cover related behavior but are not substitutes for every deleted assertion. No coverage or mutation run was performed.

## Verification

- Baseline Vitest: **168 passed**, no failed/pending/todo cases.
- Final Vitest: **110 passed**, no failed/pending/todo cases.
- Node checks: **3 passed**; these files and their production dependencies are unchanged.
- Playwright: **6 passed**, covering sign-in routing and offline reload/replay/purchase behavior across all three browsers.
- ESLint, TypeScript project check, formatting and `git diff --check` passed.
- Content hashes verified that application/Functions source, assets, manifests and test-runner configuration match the start of this request.

Local evidence is in `output/test-pruning-*`, including full baseline and final Vitest JSON reports and a pre-edit test snapshot. The durable JSON removal log is under `docs/testing`. No commit or deployment was made.

To reproduce the final runnable count and checks:

```powershell
npm run test -- --reporter=json --outputFile=output/test-pruning-verification.json
node --test scripts/quality-summary.test.mjs scripts/quality-gate.integration.test.mjs
npm run test:e2e -- --workers=1 --reporter=line
npm run lint
npx tsc -b
npm run format:check
```

The Node integration test requires the pinned Lens checkout built at `tmp/quality-lens-latest`. Root and Functions dependencies must be installed.
