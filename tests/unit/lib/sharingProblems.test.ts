import { expect, it } from 'vitest'
import {
  generateSharingProblem,
  isSharingAnswerCorrect,
  sharingProblemKey,
} from '../../../src/lib/sharingProblems'
import {
  buildDefaultTests,
  buildTestDocument,
} from '../../../src/data/taskDocuments'
import { parseTestSnapshot } from '../../../src/lib/choreParser'
import {
  documentPatch,
  activityPatch,
} from '../../../functions/src/sharing/policy'
import {
  getTestLastActive,
  manageTestOutcomePatch,
} from '../../../src/data/dailyTaskState'
import { testCategory } from '../../../src/data/testCategories'

it.each([
  { difficulty: 'easy' as const, containers: [2], maxTotal: 12, poolSize: 6 },
  { difficulty: 'hard' as const, containers: [3], maxTotal: 24, poolSize: 8 },
  {
    difficulty: 'mixed' as const,
    containers: [2, 3, 4],
    maxTotal: 24,
    poolSize: 26,
  },
])(
  'generates divisible $difficulty questions across the allowed containers without immediate repeats',
  ({ difficulty, containers, maxTotal, poolSize }) => {
    const seen = new Set<string>()
    const containerCounts = new Set<number>()
    let previousKey = ''
    for (let i = 0; i < poolSize + 3; i++) {
      const problem = generateSharingProblem(difficulty, seen)
      const key = sharingProblemKey(problem)
      expect(containers).toContain(problem.containers)
      containerCounts.add(problem.containers)
      expect(problem.total).toBeGreaterThan(0)
      expect(problem.total).toBeLessThanOrEqual(maxTotal)
      expect(problem.total % problem.containers).toBe(0)
      if (i < poolSize) expect(seen.has(key)).toBe(false)
      expect(key).not.toBe(previousKey)
      seen.delete(key)
      seen.add(key)
      previousKey = key
    }
    expect([...containerCounts].sort()).toEqual(containers)
  }
)

it('requires every symbol to be shared equally into every container', () => {
  const problem = { total: 12, containers: 3 }
  expect(isSharingAnswerCorrect(problem, [4, 4, 4])).toBe(true)
  for (const counts of [
    [3, 3, 3],
    [3, 4, 5],
    [6, 6],
    [4, 4, 4, 4],
    [0, 0, 0],
  ]) {
    expect(isSharingAnswerCorrect(problem, counts)).toBe(false)
  }
  expect(isSharingAnswerCorrect({ total: 0, containers: 0 }, [])).toBe(false)
})

it('creates, parses, validates and resets sharing tests through the shared persistence contract', () => {
  expect(testCategory.sharing).toBe('numbers')
  expect(
    buildDefaultTests('child').find((test) => test.taskType === 'sharing')
  ).toMatchObject({
    title: 'Share Equally',
    sharingTotalProblems: 5,
    sharingDifficulty: 'easy',
  })
  const document = buildTestDocument('child', 'sharing')
  const clean = documentPatch('tests', document, 'child', true)
  expect(parseTestSnapshot('share', clean)).toMatchObject({
    taskType: 'sharing',
    sharingTotalProblems: 5,
    sharingDifficulty: 'easy',
  })
  expect(
    parseTestSnapshot('share', {
      ...clean,
      sharingDifficulty: 'invalid',
      sharingTotalProblems: 100,
    })
  ).toMatchObject({ sharingDifficulty: 'easy', sharingTotalProblems: 5 })
  for (const sharingDifficulty of ['easy', 'hard', 'mixed']) {
    const settings = { sharingDifficulty, sharingTotalProblems: 9 }
    expect(documentPatch('tests', settings, 'child', true)).toEqual(settings)
    expect(parseTestSnapshot('share', { ...clean, ...settings })).toMatchObject(
      settings
    )
  }
  for (const invalid of [
    { sharingDifficulty: 'invalid' },
    { sharingTotalProblems: 0 },
    { sharingTotalProblems: 10 },
  ]) {
    expect(() => documentPatch('tests', invalid, 'child', true)).toThrow()
  }
  const completed = manageTestOutcomePatch('sharing', 100, 'success')
  expect(getTestLastActive(completed)).toBe(100)
  expect(activityPatch(completed, 'sharing', 200, '2026-11-01')).toEqual({
    manageSharingCompletedAt: 200,
    manageSharingLastOutcome: 'success',
  })
  expect(
    activityPatch(
      manageTestOutcomePatch('sharing', null, null),
      'sharing',
      200,
      '2026-11-01'
    )
  ).toEqual({ manageSharingCompletedAt: null, manageSharingLastOutcome: null })
})
