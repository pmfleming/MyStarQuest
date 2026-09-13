# Five quality improvement steps

Baseline: `69e2ab9`, preserving the existing weather exploration and earlier quality work. All five steps use ts-react-quality-lens 0.3.0, revision `986c6fd9cc82627866156ba0cf22cb1504ab8587`.

| Step                 | Result                                                                                                                                                                                                           | Local commit |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1. Weather decisions | Shared weather-code classification and precipitation thresholds; boundary tests and 78,120 equivalent scene/description/visual combinations checked.                                                             | `dbc4d76`    |
| 2. Action controls   | Resolve visibility, disabled state, reset confirmation, and layout before rendering; one utility-button rendering path.                                                                                          | `a4c8149`    |
| 3. Async actions     | Shared pending/error handling, returned field-update promises, automatic activity save retry, and duplicate-submit protection.                                                                                   | `d9319bf`    |
| 4. Explorer locality | Clock, 3D manager, worker, and rendering helpers live together; clock updates share one commit path and pointer release flushes the final queued position.                                                       | `c85e2ad`    |
| 5. Quality gate      | Pinned Lens in CI, new-blocker gating, strict whole-project checks for config changes, bounded workers, comparison artifacts, clean React Refresh boundaries, and corrected shared hook/weather type boundaries. | This commit  |

## Validation

- All 245 application tests pass across 58 Vitest files.
- Production build and TypeScript checks pass, including the relocated texture worker.
- ESLint passes with zero errors and zero warnings. Formatting passes.
- Full React-policy audit completes with **zero blockers** and 57 warnings; the `warn` verdict passes the configured gate.
- Three Node gate/report tests pass. The integration test runs the pinned Lens against a temporary Git repository and proves inherited floating-promise debt passes while a new occurrence fails.
- Cleanup tests cover scene disposal, observers, late texture completion, clock synchronization, and queued pointer release. Async tests cover duplicate submission and retry without replaying the final puzzle.

## Metric comparison

| Metric                                | Before the five steps |     After |  Change |
| ------------------------------------- | --------------------: | --------: | ------: |
| Source lines                          |                26,005 |    26,254 |    +249 |
| Summed callable cognitive complexity  |                 1,314 |     1,288 |     -26 |
| Summed callable cyclomatic complexity |                 1,849 |     1,847 |      -2 |
| Summed Halstead effort, rounded       |             8,752,790 | 8,772,741 | +19,951 |
| Clone groups                          |                     3 |         3 |       0 |
| Summed locality risk                  |                 8,123 |     8,641 |    +518 |
| Summed leverage risk                  |                   832 |       728 |    -104 |
| Typed-lint blockers                   |                    48 |         0 |     -48 |
| Deep relative imports                 |                   139 |       136 |      -3 |
| Layer violations                      |                    30 |        29 |      -1 |
| Dependency cycles                     |                     0 |         0 |       0 |

These are mixed results: cognitive/cyclomatic complexity, leverage risk, unsafe async handling, and dependency boundaries improved. Source lines, total effort, and aggregate locality risk increased; cloning is unchanged. Recovery UI, retry state, and explicit provider boundaries add code. The five steps are implemented, but the original goal of reducing every metric simultaneously has not been achieved.

Source lines sum file-level Lens signals. Complexity and effort sum callable signals; locality and leverage sum module risk scores. These aggregates are comparison aids, not additional official Lens scores. Architecture scores also depend on module count and Git history. Generated reports, documentation, and tests are outside the source-line aggregate. The strict audit ran an isolated copy preserving repository history; its artifacts retain the temporary project's provenance.

See [machine-readable comparison](2026-09-13-five-steps.json) and [quality gate operation](quality-gate.md). No source exclusions, finding suppressions, or metric thresholds were relaxed. Commits remain local; no remote push was performed.
