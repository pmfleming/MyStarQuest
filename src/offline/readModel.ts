import {
  historyDocuments,
  type OfflineState,
  type ReadCollection,
} from './model'
import { deviceDocuments } from './selectors'
import { snapshotDocument } from './firebaseTransport'

export function createReadModel(
  read: () => OfflineState | undefined,
  readDay: () => string
) {
  type Result = { id: string; data: ReturnType<typeof snapshotDocument> }[]
  const cache = new Map<ReadCollection, { inputs: unknown[]; result: Result }>()
  const empty: Result = []
  return (name: ReadCollection): Result => {
    const state = read()
    if (!state) return empty
    const history = name === 'starEvents' || name === 'redemptions'
    const day = name === 'chores' || name === 'tests' ? readDay() : ''
    const inputs = history
      ? [state.history?.[name], state.pending, state.revoked]
      : [
          state.documents[name],
          state.pending,
          state.consumed,
          day && state.activities,
          day,
          name === 'rewards' && state.history?.redemptions,
        ]
    const previous = cache.get(name)
    if (
      previous &&
      inputs.every((value, index) => Object.is(value, previous.inputs[index]))
    )
      return previous.result
    const documents = history
      ? historyDocuments(state, name)
      : deviceDocuments(state, name, day)
    const result = Object.entries(documents).map(([id, data]) => ({
      id,
      data: snapshotDocument(data),
    }))
    cache.set(name, { inputs, result })
    return result
  }
}
