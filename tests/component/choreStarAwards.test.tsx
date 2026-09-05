import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type {
  ChoreWithEphemeral,
  EatingTaskWithEphemeral,
  WaterLevel,
  ToiletStatus,
} from '../../src/data/types'

const firestore = vi.hoisted(() => ({ runTransaction: vi.fn() }))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  increment: (amount: number) => ({ increment: amount }),
  serverTimestamp: () => 'server-time',
  runTransaction: firestore.runTransaction,
}))

// Exercise the real action hook, score calculation and star transaction together.
// Only the Firestore transport is replaced; writes commit after the callback succeeds.
import { useChoreActivityActions } from '../../src/data/useChoreActivityActions'

type Document = Record<string, unknown>
const childPath = 'users/parent/children/child'
const chorePath = (id: string) => `users/parent/chores/${id}`
let documents: Map<string, Document>
const base = {
  childId: 'child',
  category: 'chore',
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  isRepeating: true,
}
const chores: ChoreWithEphemeral[] = [
  {
    ...base,
    id: 'teeth',
    title: 'Brush teeth',
    taskType: 'standard',
    starValue: 2,
  },
  {
    ...base,
    id: 'tidy',
    title: 'Tidy room',
    taskType: 'standard',
    starValue: 5,
  },
  {
    ...base,
    id: 'dinner',
    title: 'Dinner',
    taskType: 'eating',
    starValue: 3,
    dinnerDurationSeconds: 600,
    dinnerTotalBites: 2,
    manageDinnerBitesLeft: 2,
  },
  {
    ...base,
    id: 'water',
    title: 'Water & toilet',
    taskType: 'watertoiletcheck',
    starValue: 9,
    manageWaterLevel: 'empty',
    manageToiletStatus: 'didpeepee',
  },
]
const balance = () => documents.get(childPath)?.totalStars
const events = () =>
  [...documents.entries()].filter(([path]) => path.includes('/starEvents/'))
const storedChore = (id: string) =>
  documents.get(chorePath(id)) as ChoreWithEphemeral
const setup = (dateKey = '2026-09-06') =>
  renderHook(() =>
    useChoreActivityActions({
      user: { uid: 'parent' },
      activeChildId: 'child',
      dateKey,
      updateEphemeral: async (id, patch) => {
        documents.set(chorePath(id), {
          ...documents.get(chorePath(id)),
          ...patch,
        })
      },
    })
  ).result.current

const finishDinner = async (
  actions: ReturnType<typeof setup>,
  dinner: EatingTaskWithEphemeral
) => {
  const pending = actions.applyBite(dinner)
  await vi.advanceTimersByTimeAsync(850)
  return pending
}

describe('chore completion star balances', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-06T12:00:00Z'))
    documents = new Map([
      [childPath, { totalStars: 10 }],
      ['users/parent/children/sibling', { totalStars: 50 }],
      ...chores.map((chore): [string, Document] => [
        chorePath(chore.id),
        { ...chore },
      ]),
    ])
    firestore.runTransaction.mockImplementation(async (_db, callback) => {
      const pending: (() => void)[] = []
      const result = await callback({
        get: async (path: string) => {
          const data = documents.get(path)
          return { exists: () => data !== undefined, data: () => data }
        },
        set: (path: string, data: Document) =>
          pending.push(() => documents.set(path, { ...data })),
        delete: (path: string) => pending.push(() => documents.delete(path)),
        update: (path: string, patch: Document) =>
          pending.push(() => {
            const data = { ...documents.get(path) }
            for (const [key, value] of Object.entries(patch)) {
              data[key] =
                typeof value === 'object' &&
                value !== null &&
                'increment' in value
                  ? Number(data[key] ?? 0) + Number(value.increment)
                  : value
            }
            documents.set(path, data)
          }),
      })
      pending.forEach((commit) => commit())
      return result
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it.each([true, false])(
    'awards exactly 12 stars for all chores (repeating: %s)',
    async (isRepeating) => {
      for (const chore of chores)
        documents.set(chorePath(chore.id), { ...chore, isRepeating })
      const actions = setup()
      await actions.completeChore(storedChore('teeth'))
      expect(balance()).toBe(12)
      await actions.completeChore(storedChore('tidy'))
      expect(balance()).toBe(17)
      await actions.applyBite(storedChore('dinner'))
      expect(balance()).toBe(17) // A partial meal earns nothing.
      await expect(
        finishDinner(actions, storedChore('dinner') as EatingTaskWithEphemeral)
      ).resolves.toBe(true)
      expect(balance()).toBe(20)
      await actions.completeChore(storedChore('water'))
      expect(balance()).toBe(22) // Water/toilet uses its outcome score, not starValue: 9.
      expect(events().map(([, event]) => event.delta)).toEqual([2, 5, 3, 2])
      expect(events().every(([, event]) => event.childId === 'child')).toBe(
        true
      )
      expect(documents.get('users/parent/children/sibling')?.totalStars).toBe(
        50
      )
      for (const chore of chores)
        expect(documents.has(chorePath(chore.id))).toBe(isRepeating)
      if (isRepeating) {
        expect(storedChore('teeth')).toHaveProperty(
          'manageCompletedAt',
          expect.any(Number)
        )
        expect(storedChore('dinner')).toHaveProperty('manageDinnerBitesLeft', 0)
        expect(storedChore('water')).toHaveProperty(
          'manageWaterToiletCompletedAt',
          expect.any(Number)
        )
      }
    }
  )

  it('does not award reset/replayed chores twice on one day, but awards them again the next day', async () => {
    const completeDay = async (dateKey: string) => {
      const actions = setup(dateKey)
      for (const chore of chores) {
        if (chore.taskType === 'eating') {
          await actions.resetDinner(chore)
          await actions.applyBite(storedChore(chore.id))
          await finishDinner(
            actions,
            storedChore(chore.id) as EatingTaskWithEphemeral
          )
        } else {
          await actions.resetChore(chore)
          if (chore.taskType === 'watertoiletcheck')
            documents.set(chorePath(chore.id), {
              ...storedChore(chore.id),
              manageWaterLevel: 'empty',
              manageToiletStatus: 'didpeepee',
            })
          await actions.completeChore(storedChore(chore.id))
        }
      }
    }
    await completeDay('2026-09-06')
    expect(balance()).toBe(22)
    await completeDay('2026-09-06')
    expect(balance()).toBe(22)
    expect(events()).toHaveLength(4)
    await completeDay('2026-09-07')
    expect(balance()).toBe(34)
    expect(events()).toHaveLength(8)
  })

  it.each<[WaterLevel, ToiletStatus, number]>([
    ['full', 'notpeepee', -6],
    ['full', 'didpeepee', 0],
    ['twothirds', 'didpeepee', 1],
    ['empty', 'notpeepee', -4],
  ])(
    'persists the water/toilet score for %s / %s: %i',
    async (water, toilet, delta) => {
      await setup().completeChore({
        ...base,
        id: 'water',
        title: 'Water',
        taskType: 'watertoiletcheck',
        starValue: 9,
        manageWaterLevel: water,
        manageToiletStatus: toilet,
      })
      expect(balance()).toBe(10 + delta)
      expect(events()[0][1].delta).toBe(delta)
    }
  )

  it('clamps a water/toilet deduction to the available stars', async () => {
    documents.set(childPath, { totalStars: 2 })
    await setup().completeChore({
      ...base,
      id: 'water',
      title: 'Water',
      taskType: 'watertoiletcheck',
      starValue: 9,
      manageWaterLevel: 'full',
      manageToiletStatus: 'notpeepee',
    })
    expect(balance()).toBe(0)
    expect(events()[0][1].delta).toBe(-2)
  })

  it('awards no stars when dinner times out before completion', async () => {
    const actions = setup()
    await actions.startDinnerTimer(storedChore('dinner'))
    await actions.expireDinnerTimer(storedChore('dinner'))
    await expect(actions.applyBite(storedChore('dinner'))).resolves.toBe(false)
    expect(balance()).toBe(10)
    expect(events()).toHaveLength(0)
  })

  it('rejects another child’s chore without changing either balance', async () => {
    documents.set(chorePath('teeth'), {
      ...storedChore('teeth'),
      childId: 'sibling',
    })
    await expect(setup().completeChore(storedChore('teeth'))).rejects.toThrow(
      'does not belong'
    )
    expect(balance()).toBe(10)
    expect(documents.get('users/parent/children/sibling')?.totalStars).toBe(50)
    expect(events()).toHaveLength(0)
  })
})
