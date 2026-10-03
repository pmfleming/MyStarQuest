import {
  emptyState,
  mergeSharedProgress,
  rebuildSharedProgress,
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
import { importWebProgress } from './importWebProgress'
import { parseChildScope } from '../sharing/scope'

export class OfflineStore {
  private snapshot = snapshotStore<OfflineState | undefined>(undefined)
  private work: Promise<unknown> = Promise.resolve()
  private opening?: Promise<void>
  onCommit?: () => void

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
      if (this.persistence.update) {
        const { state } = await this.persistence.update(this.userId, () => {})
        this.snapshot.publish(state)
        return
      }
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
      if (this.persistence.update) {
        const { state, result } = await this.persistence.update(
          this.userId,
          (state) => {
            if (parseChildScope(this.userId)) state.shared = true
            return change(state)
          }
        )
        this.snapshot.publish(state)
        this.onCommit?.()
        return result
      }
      const draft = structuredClone(this.getSnapshot()!)
      if (parseChildScope(this.userId)) draft.shared = true
      const result = change(draft)
      await this.persistence.write(this.userId, draft)
      this.snapshot.publish(draft)
      this.onCommit?.()
      return result
    })
    this.work = operation.catch(() => {})
    return operation
  }
  queue(action: Action) {
    return this.mutate((state) => enqueue(state, action))
  }

  reload() {
    const operation = this.work.then(async () => {
      await this.open()
      const saved = await this.persistence.read(this.userId)
      if (saved) this.snapshot.publish(saved)
    })
    this.work = operation.catch(() => {})
    return operation
  }

  acknowledge(
    id: string,
    {
      collection,
      entityId,
      document,
      progress,
      progressKey,
      removed,
    }: SyncReceipt
  ) {
    return this.mutate((state) => {
      // Another tab may have acknowledged this operation and applied later work.
      if (!state.pending.some((operation) => operation.id === id)) return
      if (state.revoked) return
      const documents = state.documents[collection]
      if (document)
        documents[entityId] = latestDocument(
          collection,
          documents[entityId],
          document
        )
      else delete documents[entityId]
      state.pending = state.pending.filter((operation) => operation.id !== id)
      if (progress && progressKey)
        mergeSharedProgress(state, {
          ...state.sharedProgress,
          [progressKey]: progress,
        })
      if (removed) delete state.documents[removed.collection][removed.entityId]
      rebuildSharedProgress(state)
    })
  }

  mergeProgress(documents: Record<string, LocalDocument>) {
    return this.mutate((state) => {
      if (!state.revoked) mergeSharedProgress(state, documents)
    })
  }
  reject(id: string, message: string) {
    return this.mutate((state) => {
      state.pending = state.pending.filter((operation) => operation.id !== id)
      state.rejected = [...(state.rejected ?? []), { id, message }].slice(-20)
      rebuildSharedProgress(state)
    })
  }
  revoke() {
    return this.mutate((state) => {
      state.rejected = state.pending.map((operation) => ({
        id: operation.id,
        message: 'Access was removed; this change was not sent.',
      }))
      state.pending = []
      state.documents = { children: {}, chores: {}, tests: {}, rewards: {} }
      state.activities = {}
      state.sharedProgress = {}
      state.consumed = {}
      state.revoked = true
    })
  }

  mergeCollection(
    collection: CollectionName,
    documents: Record<string, LocalDocument>,
    preserveWebProgress = false
  ) {
    return this.mutate((state) => {
      if (state.revoked) return
      if (collection === 'children' && !state.shared) {
        const migrated = new Set(
          Object.entries(documents)
            .filter(([, child]) => child.sharedDataVersion === 1)
            .map(([id]) => id)
        )
        state.pending = state.pending.filter((operation) => {
          const action = operation.action
          const childId =
            action.kind !== 'document'
              ? action.childId
              : action.collection === 'children'
                ? action.entityId
                : (action.data.childId ??
                  state.documents[action.collection][action.entityId]?.childId)
          if (!migrated.has(String(childId))) return true
          state.rejected = [
            ...(state.rejected ?? []),
            {
              id: operation.id,
              message:
                'This child now uses shared progress. An older pending change was not sent; reopen the child.',
            },
          ].slice(-20)
          return false
        })
      }
      if (preserveWebProgress) importWebProgress(state, collection, documents)
      state.documents[collection] = Object.fromEntries(
        Object.entries(documents).map(([id, document]) => [
          id,
          latestDocument(collection, state.documents[collection][id], document),
        ])
      )
    })
  }
}
