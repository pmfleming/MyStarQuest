# TypeScript quality gate

MyStarQuest uses **ts-react-quality-lens 0.3.0**, pinned to commit `c9e853ffe256cd04c5e6b0e2383615882d3056ae` (latest `main` verified 16 September 2026) from [pmfleming/ts-react-quality-lens](https://github.com/pmfleming/ts-react-quality-lens). The CI workflow checks out and builds this revision separately from the application dependencies.

With the pinned checkout built in `tmp/quality-lens-latest`, run:

```sh
node scripts/quality-gate.mjs origin/main
```

Use `HEAD` to review uncommitted changes. `QUALITY_LENS_CLI` can point to another location of the same pinned build. The script requires a valid Git base and installed application dependencies.

The React policy requires compiler, typed lint, React Hooks, and test evidence. Normal changes use the Lens `audit --gate new-only` comparison against the merge base. New blockers or incomplete evidence fail CI; inherited findings remain visible. Numeric complexity and architecture scores guide review rather than acting as arbitrary pass/fail thresholds.

Configuration or dependency changes invalidate Lens comparison identities. For changes to the Lens config, root TypeScript configs, manifest, or lockfile, the script instead audits the whole project in a temporary copy with the new policy. It preserves Git history for architecture metrics, reuses installed dependencies, and requires **zero blockers** with complete evidence. Other unrecognized identity changes fail closed through the regular Lens audit. Initial branch pushes also use the whole-project gate.

Both paths run tests with two workers. The separate CI unit-test job and default local Vitest configuration use the same limit. The Lens test adapter has its own 120-second command limit; a timeout fails the gate.

The job uploads the JSON artifacts and a Markdown metric comparison, and adds the comparison to the GitHub job summary. Baseline metrics come from committed artifacts at the merge base, so their measurement timestamps may precede that commit. Source lines sum file signals, complexity/effort sum callable signals, and locality/leverage sum module risk scores. These aggregates are comparison aids, not additional official Lens scores. Git history and file counts affect architecture scores; inspect module details as well as totals.

`quality-gate.integration.test.mjs` checks the actual pinned Lens against a temporary Git fixture: inherited floating-promise debt passes, while a newly introduced occurrence fails. `quality-summary.test.mjs` checks metric aggregation and rejection of incomplete or blocking audit verdicts.

React providers and lazy activity definitions now have separate component modules, so React Refresh no longer needs inline suppressions. Firebase environment values have explicit optional string types and retain runtime validation. Generated Lens caches are excluded from Git; source exclusions and finding suppressions were not expanded.
