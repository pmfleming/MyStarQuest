import { emptyState, offlineStateSchema, type OfflineState } from './model'

export interface OfflinePersistence {
  read: (userId: string) => Promise<OfflineState | undefined>
  write: (userId: string, state: OfflineState) => Promise<void>
  update?: <T>(
    userId: string,
    change: (state: OfflineState) => T
  ) => Promise<{ state: OfflineState; result: T }>
}

export class IndexedDbPersistence implements OfflinePersistence {
  private database?: Promise<IDBDatabase>

  private open() {
    this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mystarquest-offline', 1)
      request.onupgradeneeded = () =>
        request.result.createObjectStore('accounts')
      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => {
          database.close()
          this.database = undefined
        }
        resolve(database)
      }
      request.onerror = () => {
        this.database = undefined
        reject(request.error)
      }
      request.onblocked = () => {
        this.database = undefined
        reject(new Error('Close other app windows to upgrade offline storage.'))
      }
    })
    return this.database
  }

  private async transaction<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      // View and delivery record commit together, before publishing success.
      const transaction = database.transaction('accounts', mode, {
        durability: 'strict',
      })
      const request = action(transaction.objectStore('accounts'))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async read(userId: string) {
    const saved: unknown = await this.transaction('readonly', (store) =>
      store.get(userId)
    )
    return offlineStateSchema.optional().parse(saved)
  }

  async write(userId: string, state: OfflineState) {
    await this.transaction('readwrite', (store) => store.put(state, userId))
  }

  async update<T>(userId: string, change: (state: OfflineState) => T) {
    const database = await this.open()
    return new Promise<{ state: OfflineState; result: T }>(
      (resolve, reject) => {
        // One read/write transaction serializes all tabs. A stale in-memory view
        // must never overwrite another tab's queue or reuse its sequence number.
        const transaction = database.transaction('accounts', 'readwrite', {
          durability: 'strict',
        })
        const accounts = transaction.objectStore('accounts')
        const request = accounts.get(userId)
        let value: { state: OfflineState; result: T }
        let failure: unknown
        request.onsuccess = () => {
          try {
            const state =
              offlineStateSchema.optional().parse(request.result) ??
              emptyState()
            const result = change(state)
            value = { state, result }
            accounts.put(state, userId)
          } catch (error) {
            failure = error
            transaction.abort()
          }
        }
        transaction.oncomplete = () => resolve(value)
        transaction.onabort = () =>
          reject(
            failure ??
              transaction.error ??
              new Error('Could not save on this device.')
          )
        transaction.onerror = () => reject(failure ?? transaction.error)
      }
    )
  }
}
