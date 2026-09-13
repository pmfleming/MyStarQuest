import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export const artifactNames = [
  'hotspots',
  'clones',
  'locality_metrics',
  'leverage_metrics',
  'lint_health',
]

export function metrics(artifacts) {
  const records = artifacts.hotspots.records
  const sumSignal = (kind, files) =>
    records
      .filter((record) => (record.kind === 'file') === files)
      .reduce(
        (sum, record) =>
          sum +
          (record.signals.find((signal) => signal.kind === kind)?.value ?? 0),
        0
      )
  return {
    source_lines: sumSignal('line_count', true),
    cognitive_complexity: sumSignal('cognitive_complexity', false),
    cyclomatic_complexity: sumSignal('cyclomatic_complexity', false),
    halstead_effort: Math.round(sumSignal('halstead_effort', false)),
    clone_groups: artifacts.clones.summary.clone_groups,
    locality_risk: artifacts.locality_metrics.records.reduce(
      (sum, record) => sum + record.score,
      0
    ),
    leverage_risk: artifacts.leverage_metrics.records.reduce(
      (sum, record) => sum + record.score,
      0
    ),
    lint_blockers: artifacts.lint_health.summary.blocking_findings,
  }
}

export function writeComparison(root, base, mode, audit) {
  const output = path.join(root, 'target/analysis')
  const current = Object.fromEntries(
    artifactNames.map((name) => [
      name,
      JSON.parse(fs.readFileSync(path.join(output, `${name}.json`), 'utf8')),
    ])
  )
  let before = null
  try {
    before = metrics(
      Object.fromEntries(
        artifactNames.map((name) => [
          name,
          JSON.parse(
            execFileSync(
              'git',
              ['show', `${base}:target/analysis/${name}.json`],
              {
                cwd: root,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                maxBuffer: 32 * 1024 * 1024,
              }
            )
          ),
        ])
      )
    )
  } catch {
    /* Initial adoption may have no committed measurements. */
  }
  const after = metrics(current)
  const comparison = {
    base,
    mode,
    verdict: audit.summary.verdict,
    methodology:
      'Baseline uses committed Lens artifacts at the merge base; current uses this run. Complexity/effort sum callables; lines sum files; locality/leverage sum risk scores (lower is better). Aggregates are comparison aids, not additional Lens scores.',
    before,
    after,
    delta: before
      ? Object.fromEntries(
          Object.keys(after).map((key) => [key, after[key] - before[key]])
        )
      : null,
  }
  fs.writeFileSync(
    path.join(output, 'quality-comparison.json'),
    JSON.stringify(comparison, null, 2) + '\n'
  )
  const rows = Object.entries(after).map(
    ([name, value]) =>
      `| ${name} | ${before?.[name] ?? 'Unavailable'} | ${value} | ${comparison.delta?.[name] ?? '—'} |`
  )
  const markdown = `## TypeScript quality gate\n\nMode: **${mode}**. Verdict: **${audit.summary.verdict}**.\n\n| Metric | Committed baseline | Current | Change |\n| --- | ---: | ---: | ---: |\n${rows.join('\n')}\n\n${comparison.methodology}\n`
  fs.writeFileSync(path.join(output, 'quality-comparison.md'), markdown)
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
  return comparison
}

export function auditPassed(artifact) {
  const summary = artifact?.summary
  return (
    summary?.complete === true &&
    summary.blocking_findings === 0 &&
    ['pass', 'warn'].includes(summary.verdict)
  )
}
