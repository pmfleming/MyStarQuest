import { collection, onSnapshot } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
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
import { snapshotStore } from '../lib/snapshotStore'

const persistence = new IndexedDbPersistence()
const runtimes = new Map<string, ReturnType<typeof createRuntime>>()

function createRuntime(userId: string) {
  const store = new OfflineStore(userId, persistence)
  const sync = new OfflineSync(store, sendToFirebase)
  const errors = snapshotStore<string | null>(null)
  const report = (error: unknown) => {
    errors.publish(
      error instanceof Error ? error.message : 'Could not save on this device.'
    )
  }
  return {
    store,
    sync,
    report,
    getError: errors.getSnapshot,
    subscribeErrors: errors.subscribe,
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
          const channel =
            typeof BroadcastChannel === 'function'
              ? new BroadcastChannel(`mystarquest-account:${userId}`)
              : undefined
          store.onCommit = () => {
            errors.publish(null)
            channel?.postMessage('changed')
          }
          cleanup.push(() => {
            store.onCommit = undefined
            channel?.close()
          })
          if (channel) {
            channel.onmessage = () => {
              void store.reload().catch(report)
            }
          }
          cleanup.push(sync.start())
          for (const name of collections) {
            const unsubscribe = onSnapshot(
              collection(db, 'users', userId, name),
              { includeMetadataChanges: true },
              (snapshot) => {
                // Firestore's query cache can be incomplete. Our own durable
                // snapshot remains authoritative until a full server result.
                if (snapshot.metadata.fromCache) return
                const documents = Object.fromEntries(
                  snapshot.docs.map((document) => [
                    document.id,
                    localDocument(document.data()),
                  ])
                )
                void store
                  .mergeCollection(
                    name,
                    documents,
                    Capacitor.getPlatform() === 'web'
                  )
                  .catch(report)
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
            if (document.visibilityState !== 'hidden') {
              void store.reload().then(sync.retry).catch(report)
            }
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
