import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
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
import { parseChildScope } from '../sharing/scope'
import type { OfflinePersistence } from './persistence'
import { emptyState } from './model'

const persistence = new IndexedDbPersistence()
const runtimes = new Map<string, ReturnType<typeof createRuntime>>()

function createRuntime(userId: string) {
  let connections = 0
  let stopConnection: (() => void) | undefined
  const scope = parseChildScope(userId)
  // Browsers without IndexedDB can use online shared operations, but do not
  // promise durable offline storage. Mutations in this mode await the server.
  let memory = emptyState()
  const onlinePersistence: OfflinePersistence = {
    read: async () => memory,
    write: async (_key, value) => {
      memory = value
    },
  }
  const store = new OfflineStore(
    userId,
    scope && typeof indexedDB === 'undefined' ? onlinePersistence : persistence
  )
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
    revoke: () => store.revoke(),
    documents: (name: CollectionName) => {
      const state = store.getSnapshot()
      return state
        ? Object.entries(
            deviceDocuments(
              state,
              name,
              getTodayDescriptor(
                new Date(),
                String(
                  state.documents.children[scope?.childId ?? '']?.timeZone ??
                    'Europe/London'
                )
              ).dateKey
            )
          ).map(([id, data]) => ({ id, data: snapshotDocument(data) }))
        : []
    },
    connect: () => {
      connections++
      const disconnect = () => {
        if (--connections === 0) {
          stopConnection?.()
          stopConnection = undefined
        }
      }
      if (connections > 1) return disconnect
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
          if (scope) {
            const childPath = `users/${scope.ownerUid}/children/${scope.childId}`
            const denied = (error: { code: string }) => {
              if (error.code === 'permission-denied')
                void store
                  .revoke()
                  .then(() =>
                    report(new Error('Access to this child was removed.'))
                  )
              else report(error)
            }
            cleanup.push(
              onSnapshot(
                doc(db, childPath),
                { includeMetadataChanges: true },
                (snapshot) => {
                  if (!snapshot.exists()) {
                    if (!snapshot.metadata.fromCache) void store.revoke()
                    return
                  }
                  void store
                    .mergeCollection('children', {
                      [scope.childId]: localDocument(snapshot.data()),
                    })
                    .catch(report)
                },
                denied
              )
            )
            for (const name of ['chores', 'tests', 'rewards'] as const) {
              const source =
                name === 'rewards'
                  ? collection(db, `${childPath}/rewards`)
                  : query(
                      collection(db, 'users', scope.ownerUid, name),
                      where('childId', '==', scope.childId)
                    )
              cleanup.push(
                onSnapshot(
                  source,
                  { includeMetadataChanges: true },
                  (snapshot) => {
                    if (snapshot.metadata.fromCache) return
                    void store
                      .mergeCollection(
                        name,
                        Object.fromEntries(
                          snapshot.docs.map((doc) => [
                            doc.id,
                            localDocument(doc.data()),
                          ])
                        )
                      )
                      .catch(report)
                  },
                  denied
                )
              )
            }
            cleanup.push(
              onSnapshot(
                collection(db, `${childPath}/activityProgress`),
                { includeMetadataChanges: true },
                (snapshot) => {
                  if (snapshot.metadata.fromCache) return
                  void store
                    .mergeProgress(
                      Object.fromEntries(
                        snapshot.docs.map((doc) => [
                          doc.id,
                          localDocument(doc.data()),
                        ])
                      )
                    )
                    .catch(report)
                },
                denied
              )
            )
          } else {
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
      stopConnection = () => {
        disposed = true
        cleanup.forEach((stop) => stop())
      }
      return disconnect
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
