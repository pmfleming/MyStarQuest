import type { PendingAction } from './model'
import { OfflineStore } from './store'
import { SyncConflict, type SyncReceipt } from './transport'
import { snapshotStore } from '../lib/snapshotStore'

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
  private status = snapshotStore<SyncStatus>({ state: 'ready', message: null })
  private store: OfflineStore
  private send: SendOperation

  constructor(store: OfflineStore, send: SendOperation) {
    this.store = store
    this.send = send
  }
  getSnapshot = this.status.getSnapshot
  subscribe = this.status.subscribe
  private publish = this.status.publish
  start() {
    this.stopped = false
    this.unsubscribe = this.store.subscribe(() => {
      if (!this.timer && this.getSnapshot().state !== 'attention')
        void this.flush()
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
        await this.store.acknowledge(operation.id, receipt)
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
