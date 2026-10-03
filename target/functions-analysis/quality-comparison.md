# Quality comparison: functions

Fresh working-tree baseline; latest Lens 0.3.0 (233239b).

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| source_lines | 2099 | 2046 | -53 |
| cognitive_complexity | 253 | 162 | -91 |
| cyclomatic_complexity | 198 | 174 | -24 |
| halstead_effort | 217812 | 233149 | 15337 |
| clone_groups | 2 | 0 | -2 |
| locality_risk | 171 | 153 | -18 |
| leverage_risk | 156 | 108 | -48 |
| lint_blockers | 33 | 0 | -33 |

Fresh pre-refactor working-tree baseline includes pending Parents UI edits. Same tool revision and unchanged configs. Complexity/effort sum named callable signals; source lines sum file signals; locality/leverage sum module risk scores. Lower is better. Physical counts include TS/TSX/JS/CSS/scripts/tests/Android Java. Source/report snapshots are under output/quality-sharing-review.
