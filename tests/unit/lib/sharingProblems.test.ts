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

it.each(['easy', 'hard'] as const)(
  'generates distinct divisible %s questions for a full nine-question session',
  (difficulty) => {
    const seen = new Set<string>()
    for (let i = 0; i < 9; i++) {
      const problem = generateSharingProblem(difficulty, seen)
      expect(problem.containers).toBeGreaterThanOrEqual(2)
      expect(problem.containers).toBeLessThanOrEqual(
        difficulty === 'easy' ? 3 : 4
      )
      expect(problem.total).toBeGreaterThan(0)
      expect(problem.total).toBeLessThanOrEqual(difficulty === 'easy' ? 12 : 24)
      expect(problem.total % problem.containers).toBe(0)
      expect(seen.has(sharingProblemKey(problem))).toBe(false)
      seen.add(sharingProblemKey(problem))
    }
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
  expect(
    documentPatch(
      'tests',
      { sharingDifficulty: 'hard', sharingTotalProblems: 9 },
      'child',
      true
    )
  ).toEqual({ sharingDifficulty: 'hard', sharingTotalProblems: 9 })
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
