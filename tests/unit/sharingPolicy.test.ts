import { expect, it } from 'vitest'
import {
  activityPatch,
  documentPatch,
} from '../../functions/src/sharing/policy'

it('keeps document permissions and field limits at the shared write boundary', () => {
  expect(
    documentPatch(
      'tests',
      {
        childId: 'child',
        taskType: 'fractions',
        title: 'Fractions',
        starValue: 9,
        fractionsMaxDenominator: 2,
        createdAt: 1,
      },
      'child',
      false
    )
  ).toEqual({
    childId: 'child',
    taskType: 'fractions',
    title: 'Fractions',
    starValue: 9,
    fractionsMaxDenominator: 2,
  })
  expect(documentPatch('rewards', { costStars: 0 }, 'child', false)).toEqual({
    costStars: 0,
  })
  expect(documentPatch('children', { totalStars: 999 }, 'child', true)).toEqual(
    { totalStars: 999 }
  )
  expect(() =>
    documentPatch('children', { displayName: 'Changed' }, 'child', false)
  ).toThrow('Only the admin')
  expect(() =>
    documentPatch('tests', { childId: 'other' }, 'child', false)
  ).toThrow()
  for (const data of [
    { starValue: -1 },
    { starValue: 10 },
    { starValue: 1.5 },
    { starValue: '3' },
    { starValue: NaN },
    { fractionsMaxDenominator: 1 },
    { dinnerTotalBites: 21 },
    { dinnerDurationSeconds: 86401 },
    { isRepeating: 'true' },
    { taskType: 'toString' },
    { title: 'x'.repeat(201) },
    { manageCompletedAt: 123 },
    { totalStars: 50 },
    { constructor: 'inherited field' },
  ])
    expect(() => documentPatch('tests', data, 'child', false)).toThrow()
  expect(() =>
    documentPatch('rewards', { childId: 'child' }, 'child', false)
  ).toThrow()
})

it('normalizes activity timestamps and admits only state belonging to that activity', () => {
  expect(
    activityPatch(
      {
        manageDinnerTimerStartedAt: 1,
        manageDinnerCompletedAt: 2,
        manageDinnerRemainingSeconds: 4.5,
        manageDinnerBitesLeft: 0,
      },
      'eating',
      500,
      '2026-10-03',
      400
    )
  ).toEqual({
    manageDinnerTimerStartedAt: 400,
    manageDinnerCompletedAt: 500,
    manageDinnerRemainingSeconds: 4.5,
    manageDinnerBitesLeft: 0,
  })
  expect(
    activityPatch(
      {
        managePVLastOutcome: 'failure',
        managePVCompletedAt: null,
        lastAttemptedAt: 1,
        lastAttemptDateKey: 'client date',
        lastAttemptOutcome: null,
      },
      'positional-notation',
      500,
      '2026-10-03'
    )
  ).toEqual({
    managePVLastOutcome: 'failure',
    managePVCompletedAt: null,
    lastAttemptedAt: 500,
    lastAttemptDateKey: '2026-10-03',
    lastAttemptOutcome: null,
  })
  for (const patch of [
    { manageMathCompletedAt: Infinity },
    { manageMathCompletedAt: 'now' },
    { manageMathLastOutcome: 'maybe' },
    { manageWaterLevel: 'empty' },
    { totalStars: 999 },
  ])
    expect(() => activityPatch(patch, 'math', 500, '2026-10-03')).toThrow()
  expect(() =>
    activityPatch({ manageDinnerBitesLeft: -1 }, 'eating', 500, '2026-10-03')
  ).toThrow()
  expect(() =>
    activityPatch(
      { manageWaterLevel: 'overflow' },
      'watertoiletcheck',
      500,
      '2026-10-03'
    )
  ).toThrow()
})
