import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { getTodayDescriptor } from '../lib/today'
import { collections, type CollectionName } from './model'
import { IndexedDbPersistence } from './persistence'
import { OfflineStore } from './store'
import { OfflineSync } from './sync'
import {
  localDocument,
  sendToFirebase,
  snapshotDocument,
} from './firebaseTransport'
import { deviceDocuments } from './selectors'

const persistence = new IndexedDbPersistence()
const runtimes = new Map<string, ReturnType<typeof createRuntime>>()

function createRuntime(userId: string) {
  const store = new OfflineStore(userId, persistence)
  const sync = new OfflineSync(store, sendToFirebase)
  let localError: string | null = null
  const errors = new Set<() => void>()
  const report = (error: unknown) => {
    localError =
      error instanceof Error ? error.message : 'Could not save on this phone.'
    errors.forEach((listener) => listener())
  }
  return {
    store,
    sync,
    report,
    getError: () => localError,
    subscribeErrors: (listener: () => void) => {
      errors.add(listener)
      return () => {
        errors.delete(listener)
      }
    },
    documents: (name: CollectionName) => {
      const state = store.getSnapshot()
      return state
        ? Object.entries(
            deviceDocuments(state, name, getTodayDescriptor().dateKey)
          ).map(([id, data]) => ({ id, data: snapshotDocument(data) }))
        : []
    },
    connect: () => {
      let disposed = false
      const cleanup: (() => void)[] = []
      void store
        .open()
        .then(() => {
          if (disposed) return
          cleanup.push(sync.start())
          for (const name of collections) {
            let receivedServer = false
            const unsubscribe = onSnapshot(
              collection(db, 'users', userId, name),
              { includeMetadataChanges: true },
              (snapshot) => {
                if (
                  snapshot.metadata.fromCache &&
                  (receivedServer || snapshot.empty)
                )
                  return
                if (!snapshot.metadata.fromCache) receivedServer = true
                const documents = Object.fromEntries(
                  snapshot.docs.map((document) => [
                    document.id,
                    localDocument(document.data()),
                  ])
                )
                void store.mergeCollection(name, documents).catch(report)
              },
              (error) => {
                // Keep local data on backend failure. Permission errors need attention;
                // queued writes retain their own error/retry state independently.
                if (error.code === 'permission-denied')
                  report(
                    new Error(
                      'Cloud access was denied. Local data is still available; check account access.'
                    )
                  )
              }
            )
            cleanup.push(unsubscribe)
          }
          const wake = () => {
            if (document.visibilityState !== 'hidden') sync.retry()
          }
          window.addEventListener('online', wake)
          document.addEventListener('visibilitychange', wake)
          cleanup.push(() => {
            window.removeEventListener('online', wake)
            document.removeEventListener('visibilitychange', wake)
          })
        })
        .catch(report)
      return () => {
        disposed = true
        cleanup.forEach((stop) => stop())
      }
    },
  }
}

export function offlineRuntime(userId: string) {
  let runtime = runtimes.get(userId)
  if (!runtime) {
    runtime = createRuntime(userId)
    runtimes.set(userId, runtime)
  }
  return runtime
}
