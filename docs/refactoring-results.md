# Refactoring results — 5 September 2026

The refactor consolidates task completion fields, ephemeral-state merging,
completion persistence, math activity props, preset actions, and season rules.
It preserves the artwork and insect changes that were already in the working tree.

## Measurements

The baseline is the working tree immediately before this refactor, including
uncommitted changes. Complexity and effort below cover the same 14 edited
production modules before and after; clone counts cover the entire source tree.

| Metric                                        |    Before |     After |      Change |
| --------------------------------------------- | --------: | --------: | ----------: |
| Production lines in edited modules            |     3,455 |     3,204 | −251 (7.3%) |
| Cognitive complexity proxy, edited modules    |       429 |       366 |      −14.7% |
| Summed cyclomatic complexity, edited modules  |       493 |       429 |      −13.0% |
| Lexical Halstead effort proxy, edited modules | 7,944,403 | 7,393,950 |       −6.9% |
| Source clone groups                           |        15 |        10 |      −33.3% |
| High-risk hotspot records                     |       176 |       171 |          −5 |
| Type assertions                               |        32 |        31 |          −1 |

Regression coverage adds 240 test-code lines, so production plus test code is
**11 lines shorter overall**. Documentation is excluded from code-line totals.
The project-wide cognitive proxy falls from 2,264 to 2,201.

Shared rules now have more reuse: reading, merging, and awarding task completion
use the same typed field map; both date entry points use the season rules; and
chore completion and final dinner bites use the same persistence operation.
The analyzer's locality risk for `useChoreActivityActions.ts` falls from 69 to 51
with direct regression coverage. Season-module inbound reach rises from 3 to 5
import edges, including the type re-export. These are localized improvements:
the project's 62 high-risk locality records and 43 reported dependency cycles
remain unchanged. A higher inbound-reach score also means more responsibility
for the shared module, rather than an unconditional quality improvement.

## Verification

- Type checking passes (`tsc -b`).
- Lint passes, with eight existing Fast Refresh warnings in an untouched module.
- Prettier passes for every edited source and test file. The repository-wide
  check finds formatting issues in unrelated artwork files and temporary dependencies.
- Vitest: 79 tests pass across 28 suites. The same two suites fail before and
  after because insect content is missing `garden-spider ability` artwork.
- Playwright: all three browser smoke tests pass (Chromium, Firefox, WebKit).
  The required browser binaries were installed to run these checks.
- Vite bundling succeeds. `npm run build` fails its asset-budget gate on both
  the baseline and final source: approximately 95.04 MiB against a 95.00 MiB limit.
  Baseline assets total 99,655,243 bytes; final assets total 99,661,748 bytes.

## Method and limits

The configured local `ts-react-quality-lens` analyzer supplied hotspots, clones,
locality, leverage, and type-assertion findings. No findings were suppressed and
no analyzer exclusions or thresholds were changed. Its cognitive proxy counts
syntax and includes nested function records; it is not Sonar cognitive complexity.

Cyclomatic complexity uses ESLint's classic `complexity` rule, summed across
functions. Halstead effort is a lexical estimate using TypeScript-ESLint tokens,
including JSX and types: `E = (n1 / 2) × (N2 / n2) × (N1 + N2) × log2(n1 + n2)`.
Identifiers and literals are operands; other tokens are operators. Module effort
estimates are summed. This estimates code complexity, not actual developer hours.

Baseline source-set hash:
`82503f1d6928a05a733c3c45c22023e90847c4de74acc96de0406722c346e15c`.
Final source-set hash:
`f2d77557e35f14f3a30802eeab3708222f974bf3205e76596b000a75f3828dd5`.
