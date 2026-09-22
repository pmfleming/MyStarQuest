import { describe, expect, it, vi } from 'vitest'
import {
  childSnapshotDataSchema,
  rewardSnapshotDataSchema,
} from '../../../src/data/types'
import {
  parseChoreSnapshot,
  parseTestSnapshot,
} from '../../../src/lib/choreParser'

describe('stored document contracts', () => {
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
