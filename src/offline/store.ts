import {
  emptyState,
  enqueue,
  type Action,
  type CollectionName,
  type LocalDocument,
  type OfflineState,
} from './model'
import type { OfflinePersistence } from './persistence'

export class OfflineStore {
  private state: OfflineState | undefined
  private listeners = new Set<() => void>()
  private work: Promise<unknown> = Promise.resolve()
  private opening?: Promise<void>

  readonly userId: string
  private persistence: OfflinePersistence
  constructor(userId: string, persistence: OfflinePersistence) {
    this.userId = userId
    this.persistence = persistence
  }

  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private publish(state: OfflineState) {
    this.state = state
    this.listeners.forEach((listener) => listener())
  }
  open() {
    this.opening ??= (async () => {
      const saved = await this.persistence.read(this.userId)
      if (saved && saved.version !== 1)
        throw new Error('Unsupported offline data version. Update the app.')
      const state = saved ?? emptyState()
      if (!saved) await this.persistence.write(this.userId, state)
      this.publish(state)
    })().catch((error) => {
      this.opening = undefined
      throw error
    })
    return this.opening
  }
  mutate<T>(change: (draft: OfflineState) => T): Promise<T> {
    const operation = this.work.then(async () => {
      await this.open()
      const draft = structuredClone(this.state!)
      const result = change(draft)
      await this.persistence.write(this.userId, draft)
      this.publish(draft)
      return result
    })
    this.work = operation.catch(() => {})
    return operation
  }
  queue(action: Action) {
    return this.mutate((state) => enqueue(state, action))
  }

  mergeCollection(
    collection: CollectionName,
    documents: Record<string, LocalDocument>
  ) {
    return this.mutate((state) => {
      const next = { ...documents }
      const revision =
        collection === 'children' ? 'offlineBalanceRevision' : 'offlineRevision'
      for (const [id, document] of Object.entries(next)) {
        const previous = state.documents[collection][id]
        if (
          previous &&
          Number(previous[revision] ?? 0) > Number(document[revision] ?? 0)
        )
          next[id] = previous
      }
      state.documents[collection] = next
    })
  }
}
