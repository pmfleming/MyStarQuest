import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type Query,
  type FirestoreError,
} from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { db } from '../firebaseDb'
import { getTodayDescriptor } from '../lib/today'
import { collections, type CollectionName, type LocalDocument } from './model'
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

// Query caches can be incomplete; keep the durable snapshot until a server result.
function subscribeToCollection(
  source: Query,
  merge: (documents: Record<string, LocalDocument>) => Promise<unknown>,
  report: (error: unknown) => void,
  denied: (error: FirestoreError) => void
) {
  return onSnapshot(
    source,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.fromCache) return
      void merge(
        Object.fromEntries(
          snapshot.docs.map((doc) => [doc.id, localDocument(doc.data())])
        )
      ).catch(report)
    },
    denied
  )
}

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
          const childPath = scope
            ? `users/${scope.ownerUid}/children/${scope.childId}`
            : ''
          const denied = (error: FirestoreError) => {
            if (scope) {
              if (error.code === 'permission-denied')
                void store
                  .revoke()
                  .then(() =>
                    report(new Error('Access to this child was removed.'))
                  )
              else report(error)
            } else if (error.code === 'permission-denied')
              report(
                new Error(
                  'Cloud access was denied. Local data is still available; check account access.'
                )
              )
          }
          if (scope) {
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
            cleanup.push(
              subscribeToCollection(
                collection(db, `${childPath}/activityProgress`),
                (documents) => store.mergeProgress(documents),
                report,
                denied
              )
            )
          }
          for (const name of collections) {
            if (scope && name === 'children') continue
            const source =
              scope && name === 'rewards'
                ? collection(db, `${childPath}/rewards`)
                : collection(db, 'users', scope?.ownerUid ?? userId, name)
            cleanup.push(
              subscribeToCollection(
                scope && name !== 'rewards'
                  ? query(source, where('childId', '==', scope.childId))
                  : source,
                (documents) =>
                  store.mergeCollection(
                    name,
                    documents,
                    !scope && Capacitor.getPlatform() === 'web'
                  ),
                report,
                denied
              )
            )
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
