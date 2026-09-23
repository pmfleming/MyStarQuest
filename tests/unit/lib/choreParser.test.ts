import { describe, expect, it, vi } from 'vitest'
import {
  childSnapshotDataSchema,
  getManageTaskCompletedAt,
  rewardSnapshotDataSchema,
} from '../../../src/data/types'
import {
  buildDefaultTests,
  buildTestDocument,
} from '../../../src/data/taskDocuments'
import {
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
} from '../../../src/data/dailyTaskState'
import { validateTaskFields } from '../../../src/data/taskLimits'
import {
  parseChoreSnapshot,
  parseTestSnapshot,
} from '../../../src/lib/choreParser'

describe('stored document contracts', () => {
  it('includes fractions by default and round-trips its settings, completion, and reset', () => {
    expect(
      buildDefaultTests('child').filter((test) => test.taskType === 'fractions')
    ).toHaveLength(1)
    const document = buildTestDocument('child', 'fractions')
    const test = parseTestSnapshot('fractions', {
      ...document,
      createdAt: undefined,
      fractionsTotalProblems: 7,
    })!
    expect(test).toMatchObject({
      taskType: 'fractions',
      fractionsTotalProblems: 7,
      starValue: 3,
    })
    expect(
      parseChoreSnapshot('fractions', { ...document, createdAt: undefined })
    ).toBeNull()
    expect(() => validateTaskFields({ fractionsTotalProblems: 10 })).toThrow(
      RangeError
    )
    const completed = mergeTestEphemeral(
      test,
      manageTestOutcomePatch('fractions', 123, 'success')
    )
    expect(getManageTaskCompletedAt(completed)).toBe(123)
    expect(getTestLastActive(completed)).toBe(123)
    const reset = mergeTestEphemeral(
      completed,
      manageTestOutcomePatch('fractions', null, null)
    )
    expect(getManageTaskCompletedAt(reset)).toBeNull()
  })
  it('rejects invalid documents', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(parseChoreSnapshot('bad', null as never)).toBeNull()
      expect(parseTestSnapshot('bad', null as never)).toBeNull()
      expect(
        parseChoreSnapshot('bad-date', { createdAt: { toDate: 123 } })
      ).toBeNull()
      const timestamp = {
        value: new Date(123),
        toDate() {
          return this.value
        },
      }
      expect(
        parseChoreSnapshot('date', { createdAt: timestamp })?.createdAt
      ).toEqual(timestamp.value)
    } finally {
      warning.mockRestore()
    }
  })

  it('keeps stored star balances and reward costs finite', () => {
    expect(childSnapshotDataSchema.parse({ totalStars: 7 }).totalStars).toBe(7)
    expect(childSnapshotDataSchema.parse({ totalStars: NaN }).totalStars).toBe(
      0
    )
    expect(rewardSnapshotDataSchema.parse({ costStars: 6 }).costStars).toBe(6)
    expect(
      rewardSnapshotDataSchema.parse({ costStars: Infinity }).costStars
    ).toBe(0)
  })
})
