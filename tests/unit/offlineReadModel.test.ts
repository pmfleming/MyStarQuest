import { expect, it, vi } from 'vitest'
vi.mock('../../src/offline/firebaseTransport', () => ({
  snapshotDocument: (data: unknown) => data,
}))
import { createReadModel } from '../../src/offline/readModel'
import { emptyState } from '../../src/offline/model'

it('retains unrelated collection results and updates day-scoped progress at rollover', () => {
  let state = emptyState(),
    day = '2026-11-16'
  state.documents.chores.task = { title: 'Tidy' }
  state.activities['chores/task/2026-11-16'] = {
    patch: { manageCompletedAt: 100 },
    complete: true,
  }
  const read = createReadModel(
    () => state,
    () => day
  )
  const chores = read('chores'),
    history = read('starEvents')
  expect(read('chores')).toBe(chores)
  state = {
    ...state,
    history: { starEvents: { event: { delta: 1 } }, redemptions: {} },
  }
  expect(read('chores')).toBe(chores)
  expect(read('starEvents')).not.toBe(history)
  day = '2026-11-17'
  expect(read('chores')).not.toBe(chores)
  expect(read('chores')[0]?.data).toMatchObject({ manageCompletedAt: null })
})
