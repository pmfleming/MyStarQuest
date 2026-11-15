import { afterEach, expect, it, vi } from 'vitest'
import {
  getSharingFriends,
  getSharingTreats,
  pickSharingTreat,
  pickSharingFriends,
} from '../../../src/data/sharingFriends'

afterEach(() => vi.restoreAllMocks())

it.each(['princess', 'teenie'] as const)(
  'offers a varied cast and illustrated tokens for %s',
  (theme) => {
    expect(getSharingFriends(theme).length).toBeGreaterThan(4)
    const treats = getSharingTreats(theme)
    expect(treats.length).toBeGreaterThan(1)
    for (const treat of treats) expect(treat.src).toBeTruthy()
  }
)

it('uses princesses for the princess theme and Teeniepings for teenie', () => {
  expect(getSharingFriends('princess').map((friend) => friend.kind)).toEqual(
    Array(6).fill('princess')
  )
  expect(getSharingFriends('teenie').map((friend) => friend.name)).toContain(
    'Heartsping'
  )
})

it('never repeats the previous treat back to back', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  expect(pickSharingTreat('teenie', 'symbols').id).not.toBe('symbols')
  expect(pickSharingTreat('princess', 'crowns').id).not.toBe('crowns')
  expect(pickSharingTreat('princess').id).toBe('crowns')
})

it.each([2, 3, 4])(
  'rotates %i Teeniepings without repeats or duplicate friends',
  (count) => {
    const first = pickSharingFriends('teenie', count)
    const second = pickSharingFriends('teenie', count, first)
    expect(first).toHaveLength(count)
    expect(second).toHaveLength(count)
    expect(new Set(second.map((friend) => friend.name)).size).toBe(count)
    expect(second.every((friend) => !first.includes(friend))).toBe(true)
  }
)

it('uses every available new princess before reusing friends in a four-person round', () => {
  const first = pickSharingFriends('princess', 4)
  const second = pickSharingFriends('princess', 4, first)
  expect(new Set(second.map((friend) => friend.name)).size).toBe(4)
  expect(second.filter((friend) => !first.includes(friend))).toHaveLength(2)
})
