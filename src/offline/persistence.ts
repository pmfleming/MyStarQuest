import { offlineStateSchema, type OfflineState } from './model'

export interface OfflinePersistence {
  read: (userId: string) => Promise<OfflineState | undefined>
  write: (userId: string, state: OfflineState) => Promise<void>
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
}
