import type { OfflineState } from './model'

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

  async read(userId: string): Promise<OfflineState | undefined> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('accounts', 'readonly')
      const request = transaction.objectStore('accounts').get(userId)
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async write(userId: string, state: OfflineState): Promise<void> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      // One commit contains both the visible change and its delivery record.
      const transaction = database.transaction('accounts', 'readwrite', {
        durability: 'strict',
      })
      transaction.objectStore('accounts').put(state, userId)
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
    })
  }
}
