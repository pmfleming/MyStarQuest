# Quality comparison: frontend

Fresh working-tree baseline; latest Lens 0.3.0 (233239b).

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| source_lines | 33447 | 33354 | -93 |
| cognitive_complexity | 1671 | 1674 | 3 |
| cyclomatic_complexity | 2346 | 2344 | -2 |
| halstead_effort | 11572736 | 11035991 | -536745 |
| clone_groups | 2 | 0 | -2 |
| locality_risk | 12712 | 12713 | 1 |
| leverage_risk | 672 | 476 | -196 |
| lint_blockers | 5 | 0 | -5 |

Fresh pre-refactor working-tree baseline includes pending Parents UI edits. Same tool revision and unchanged configs. Complexity/effort sum named callable signals; source lines sum file signals; locality/leverage sum module risk scores. Lower is better. Physical counts include TS/TSX/JS/CSS/scripts/tests/Android Java. Source/report snapshots are under output/quality-sharing-review.
