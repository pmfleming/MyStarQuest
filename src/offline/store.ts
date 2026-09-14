import {
  emptyState,
  enqueue,
  latestDocument,
  type Action,
  type CollectionName,
  type LocalDocument,
  type OfflineState,
} from './model'
import type { OfflinePersistence } from './persistence'
import { snapshotStore } from '../lib/snapshotStore'
import type { SyncReceipt } from './transport'

export class OfflineStore {
  private snapshot = snapshotStore<OfflineState | undefined>(undefined)
  private work: Promise<unknown> = Promise.resolve()
  private opening?: Promise<void>

  readonly userId: string
  private persistence: OfflinePersistence
  constructor(userId: string, persistence: OfflinePersistence) {
    this.userId = userId
    this.persistence = persistence
  }

  getSnapshot = this.snapshot.getSnapshot
  subscribe = this.snapshot.subscribe
  open() {
    this.opening ??= (async () => {
      const saved = await this.persistence.read(this.userId)
      if (saved && saved.version !== 1)
        throw new Error('Unsupported offline data version. Update the app.')
      const state = saved ?? emptyState()
      if (!saved) await this.persistence.write(this.userId, state)
      this.snapshot.publish(state)
    })().catch((error) => {
      this.opening = undefined
      throw error
    })
    return this.opening
  }
  mutate<T>(change: (draft: OfflineState) => T): Promise<T> {
    const operation = this.work.then(async () => {
      await this.open()
      const draft = structuredClone(this.getSnapshot()!)
      const result = change(draft)
      await this.persistence.write(this.userId, draft)
      this.snapshot.publish(draft)
      return result
    })
    this.work = operation.catch(() => {})
    return operation
  }
  queue(action: Action) {
    return this.mutate((state) => enqueue(state, action))
  }

  acknowledge(id: string, { collection, entityId, document }: SyncReceipt) {
    return this.mutate((state) => {
      const documents = state.documents[collection]
      if (document)
        documents[entityId] = latestDocument(
          collection,
          documents[entityId],
          document
        )
      else delete documents[entityId]
      state.pending = state.pending.filter((operation) => operation.id !== id)
    })
  }

  mergeCollection(
    collection: CollectionName,
    documents: Record<string, LocalDocument>
  ) {
    return this.mutate((state) => {
      state.documents[collection] = Object.fromEntries(
        Object.entries(documents).map(([id, document]) => [
          id,
          latestDocument(collection, state.documents[collection][id], document),
        ])
      )
    })
  }
}
