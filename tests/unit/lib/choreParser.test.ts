import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  childSnapshotDataSchema,
  rewardSnapshotDataSchema,
} from '../../../src/data/types'
import {
  parseChoreSnapshot,
  parseTestSnapshot,
} from '../../../src/lib/choreParser'

describe('stored document contracts', () => {
  it('normalizes malformed chore settings and preserves a recorded test result', () => {
    expect(
      parseChoreSnapshot('dinner', {
        choreType: 'eating',
        childId: 'child',
        starValue: '3',
        dinnerDurationSeconds: 'invalid',
        dinnerTotalBites: null,
      })
    ).toMatchObject({
      id: 'dinner',
      childId: 'child',
      taskType: 'eating',
      starValue: 1,
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    })
    expect(
      parseTestSnapshot('math', {
        testType: 'math',
        childId: 'child',
        mathTotalProblems: 8,
        mathDifficulty: 'hard',
        lastAttemptedAt: 12345,
        lastAttemptDateKey: '2026-09-06',
        lastAttemptOutcome: 'success',
      })
    ).toMatchObject({
      taskType: 'math',
      mathTotalProblems: 8,
      mathDifficulty: 'hard',
      lastAttemptedAt: 12345,
      lastAttemptDateKey: '2026-09-06',
      lastAttemptOutcome: 'success',
    })
  })

  it('rejects invalid documents', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(parseChoreSnapshot('bad', null as never)).toBeNull()
      expect(parseTestSnapshot('bad', null as never)).toBeNull()
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
