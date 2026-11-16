import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  artifactNames,
  auditPassed,
  comparableArtifacts,
  metrics,
} from './quality-summary.mjs'

test('rejects historical metrics from a different or missing analysis identity', () => {
  const current = Object.fromEntries(
    artifactNames.map((name) => [
      name,
      { analysis_identity: { id: 'current' } },
    ])
  )
  assert.equal(comparableArtifacts(current, structuredClone(current)), true)
  const previous = structuredClone(current)
  previous.hotspots.analysis_identity.id = 'old-function-formula'
  assert.equal(comparableArtifacts(current, previous), false)
  delete previous.hotspots.analysis_identity
  assert.equal(comparableArtifacts(current, previous), false)
  assert.equal(comparableArtifacts({}, {}), false)
})

test('accepts complete pass/warn verdicts, and rejects blockers or missing evidence', () => {
  const complete = { complete: true, blocking_findings: 0, verdict: 'pass' }
  assert.equal(auditPassed({ summary: complete }), true)
  assert.equal(auditPassed({ summary: { ...complete, verdict: 'warn' } }), true)
  for (const change of [
    { blocking_findings: 1 },
    { complete: false },
    { verdict: 'incomplete' },
    { verdict: 'fail' },
  ]) {
    assert.equal(auditPassed({ summary: { ...complete, ...change } }), false)
  }
  assert.equal(auditPassed({}), false)
})

test('does not double count callable lines as file lines', () => {
  const artifacts = {
    hotspots: {
      records: [
        { kind: 'file', signals: [{ kind: 'line_count', value: 100 }] },
        {
          kind: 'function',
          signals: [
            { kind: 'line_count', value: 20 },
            { kind: 'cognitive_complexity', value: 4 },
            { kind: 'cyclomatic_complexity', value: 3 },
            { kind: 'halstead_effort', value: 15.8 },
          ],
        },
      ],
    },
    clones: { summary: { clone_groups: 2 } },
    locality_metrics: { records: [{ score: 8 }] },
    leverage_metrics: { records: [{ score: 6 }] },
    lint_health: { summary: { blocking_findings: 1 } },
  }
  assert.deepEqual(metrics(artifacts), {
    source_lines: 100,
    cognitive_complexity: 4,
    cyclomatic_complexity: 3,
    halstead_effort: 16,
    clone_groups: 2,
    locality_risk: 8,
    leverage_risk: 6,
    lint_blockers: 1,
  })
})
