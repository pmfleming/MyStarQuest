# Five quality improvements compared with 8914dce

Frontend production TS/TSX. Functions unchanged. Same Lens revision, configuration, thresholds, exclusions and whole-project audit scope as baseline.

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| source_files | 275 | 278 | +3 |
| source_lines | 34298 | 34354 | +56 |
| cognitive | 1783 | 1783 | +0 |
| max_cognitive | 28 | 19 | -9 |
| cyclomatic | 2446 | 2451 | +5 |
| max_cyclomatic | 24 | 19 | -5 |
| estimated_effort | 11385510 | 11183898 | -201612 |
| locality_risk | 12717 | 12885 | +168 |
| leverage_risk | 336 | 336 | +0 |
| clone_groups | 0 | 0 | +0 |
| accessibility_findings | 9 | 6 | -3 |
| warnings | 59 | 57 | -2 |
| blockers | 0 | 0 | +0 |

Estimated effort and maximum complexity improve. Total complexity, line count and summed locality risk do not all improve; see `docs/quality-review/2026-10-22-next-five.json` for limitations and validation.
