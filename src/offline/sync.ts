import type { PendingAction } from './model'
import { OfflineStore } from './store'
import { SyncConflict, type SyncReceipt } from './transport'

export type SyncStatus = {
  state: 'ready' | 'syncing' | 'waiting' | 'attention'
  message: string | null
}
export type SendOperation = (
  userId: string,
  operation: PendingAction
) => Promise<SyncReceipt>

export class OfflineSync {
  private stopped = true
  private running = false
  private timer?: ReturnType<typeof setTimeout>
  private unsubscribe?: () => void
  private retryMs = 1000
  private status: SyncStatus = { state: 'ready', message: null }
  private listeners = new Set<() => void>()
  private store: OfflineStore
  private send: SendOperation

  constructor(store: OfflineStore, send: SendOperation) {
    this.store = store
    this.send = send
  }
  getSnapshot = () => this.status
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private publish(status: SyncStatus) {
    this.status = status
    this.listeners.forEach((listener) => listener())
  }
  start() {
    this.stopped = false
    this.unsubscribe = this.store.subscribe(() => {
      if (!this.timer && this.status.state !== 'attention') void this.flush()
    })
    void this.flush()
    return () => {
      this.stopped = true
      this.unsubscribe?.()
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }
  retry = () => {
    clearTimeout(this.timer)
    this.timer = undefined
    this.retryMs = 1000
    void this.flush()
  }

  async flush() {
    if (this.stopped || this.running) return
    this.running = true
    try {
      await this.store.open()
      while (!this.stopped) {
        const operation = this.store.getSnapshot()?.pending[0]
        if (!operation) {
          this.publish({ state: 'ready', message: null })
          break
        }
        this.publish({ state: 'syncing', message: null })
        const receipt = await this.send(this.store.userId, operation)
        // A lost local acknowledgement is safe: the queue keeps the same ID.
        await this.store.mutate((state) => {
          const existing = state.documents[receipt.collection][receipt.entityId]
          const revision =
            receipt.collection === 'children'
              ? 'offlineBalanceRevision'
              : 'offlineRevision'
          if (!receipt.document)
            delete state.documents[receipt.collection][receipt.entityId]
          else if (
            Number(existing?.[revision] ?? 0) <=
            Number(receipt.document[revision] ?? 0)
          ) {
            state.documents[receipt.collection][receipt.entityId] =
              receipt.document
          }
          state.pending = state.pending.filter(
            (pending) => pending.id !== operation.id
          )
        })
        this.retryMs = 1000
      }
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : ''
      const needsAttention =
        error instanceof SyncConflict ||
        /permission-denied|unauthenticated|invalid-argument/.test(code)
      this.publish({
        state: needsAttention ? 'attention' : 'waiting',
        message: needsAttention
          ? error instanceof SyncConflict
            ? error.message
            : 'Sync needs attention. Sign in again or check account access. Your changes are saved on this phone.'
          : null,
      })
      if (!this.stopped && !needsAttention) {
        this.timer = setTimeout(() => {
          this.timer = undefined
          void this.flush()
        }, this.retryMs)
        this.retryMs = Math.min(60_000, this.retryMs * 2)
      }
    } finally {
      this.running = false
    }
  }
}
