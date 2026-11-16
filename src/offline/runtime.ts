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
import { getDateKeyInTimeZone } from '../lib/today'
import { createReadModel } from './readModel'
import { historySources } from './historyQueries'
import { collections, type LocalDocument } from './model'
import { IndexedDbPersistence } from './persistence'
import { OfflineStore } from './store'
import { OfflineSync } from './sync'
import { localDocument, sendToFirebase } from './firebaseTransport'
import { snapshotStore } from '../lib/snapshotStore'
import { parseChildScope } from '../sharing/scope'
import type { OfflinePersistence } from './persistence'
import { emptyState } from './model'

const persistence = new IndexedDbPersistence()
type Runtime = ReturnType<typeof createRuntime>
const runtimes = new Map<string, WeakRef<Runtime>>()
const connectedRuntimes = new Map<string, Runtime>()
const collectedRuntimes = new FinalizationRegistry<string>((userId) => {
  if (!runtimes.get(userId)?.deref()) runtimes.delete(userId)
})

function createRuntime(userId: string) {
  const connections = new Set<symbol>()
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
  const dateKey = () =>
    getDateKeyInTimeZone(
      new Date(),
      String(
        store.getSnapshot()?.documents.children[scope?.childId ?? '']
          ?.timeZone ?? 'Europe/London'
      )
    )
  const runtime = {
    store,
    sync,
    report,
    getError: errors.getSnapshot,
    subscribeErrors: errors.subscribe,
    revoke: () => store.revoke(),
    dateKey,
    documents: createReadModel(store.getSnapshot, dateKey),
    connect: () => {
      connectedRuntimes.set(userId, runtime)
      const connection = Symbol()
      connections.add(connection)
      const disconnect = () => {
        if (!connections.delete(connection) || connections.size) return
        stopConnection?.()
        stopConnection = undefined
        if (connectedRuntimes.get(userId) === runtime)
          connectedRuntimes.delete(userId)
      }
      if (connections.size > 1) return disconnect
      let disposed = false
      const cleanup: (() => void)[] = []
      const stop = () => {
        disposed = true
        cleanup.splice(0).forEach((stop) => stop())
      }
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
                  .catch(report)
              else report(error)
            } else if (error.code === 'permission-denied')
              report(
                new Error(
                  'Cloud access was denied. Local data is still available; check account access.'
                )
              )
          }
          // Query caches can be incomplete; retain durable data until a server result.
          const watch = (
            source: Query,
            merge: (
              documents: Record<string, LocalDocument>
            ) => Promise<unknown>,
            keyForDocument: (id: string, data: LocalDocument) => string = (
              id
            ) => id,
            register = true
          ) => {
            let known: Map<string, [string, LocalDocument]> | undefined
            const stop = onSnapshot(
              source,
              { includeMetadataChanges: true },
              (snapshot) => {
                if (snapshot.metadata.fromCache) return
                const changes = known ? snapshot.docChanges?.() : undefined
                if (changes?.length === 0) return
                if (!known || !changes) {
                  known = new Map(
                    snapshot.docs.map((doc) => {
                      const data = localDocument(doc.data())
                      return [doc.id, [keyForDocument(doc.id, data), data]]
                    })
                  )
                } else {
                  for (const change of changes) {
                    if (change.type === 'removed') known.delete(change.doc.id)
                    else {
                      const data = localDocument(change.doc.data())
                      known.set(change.doc.id, [
                        keyForDocument(change.doc.id, data),
                        data,
                      ])
                    }
                  }
                }
                void merge(Object.fromEntries(known.values())).catch(report)
              },
              denied
            )
            if (register) cleanup.push(stop)
            return stop
          }
          if (scope) {
            cleanup.push(
              onSnapshot(
                doc(db, childPath),
                { includeMetadataChanges: true },
                (snapshot) => {
                  if (!snapshot.exists()) {
                    if (!snapshot.metadata.fromCache)
                      void store.revoke().catch(report)
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
            watch(
              collection(db, `${childPath}/activityProgress`),
              (documents) => store.mergeProgress(documents)
            )
          }
          // Reconcile old one-time rewards independently of the visible history.
          const rewardWatches = new Map<string, () => void>()
          cleanup.push(() => {
            rewardWatches.forEach((stop) => stop())
            rewardWatches.clear()
          })
          const reconcileRewards = (
            documents: Record<string, LocalDocument>
          ) => {
            const ids = new Set(
              Object.keys(documents).filter(
                (id) =>
                  documents[id]?.isRepeating !== true &&
                  !store.getSnapshot()?.redeemedRewards?.[id]
              )
            )
            for (const [id, stop] of rewardWatches) {
              if (!ids.has(id)) {
                stop()
                rewardWatches.delete(id)
              }
            }
            for (const id of ids) {
              if (rewardWatches.has(id)) continue
              const stops: (() => void)[] = []
              rewardWatches.set(id, () => stops.forEach((stop) => stop()))
              for (const { source, key } of historySources(
                userId,
                'redemptions'
              )) {
                stops.push(
                  watch(
                    query(source, where('rewardId', '==', id)),
                    async (documents) => {
                      await store.mergeRewardRedemptions(documents)
                      if (store.getSnapshot()?.redeemedRewards?.[id]) {
                        rewardWatches.get(id)?.()
                        rewardWatches.delete(id)
                      }
                    },
                    key,
                    false
                  )
                )
              }
            }
          }
          for (const name of collections) {
            if (scope && name === 'children') continue
            const source =
              scope && name === 'rewards'
                ? collection(db, `${childPath}/rewards`)
                : collection(db, 'users', scope?.ownerUid ?? userId, name)
            watch(
              scope && name !== 'rewards'
                ? query(source, where('childId', '==', scope.childId))
                : source,
              async (documents) => {
                await store.mergeCollection(
                  name,
                  documents,
                  !scope && Capacitor.getPlatform() === 'web'
                )
                if (!disposed && name === 'rewards') reconcileRewards(documents)
              }
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
        .catch((error: unknown) => {
          if (disposed) return
          stop()
          report(error)
        })
      stopConnection = stop
      return disconnect
    },
  }
  return runtime
}

export function offlineRuntime(userId: string) {
  let runtime = connectedRuntimes.get(userId) ?? runtimes.get(userId)?.deref()
  if (!runtime) {
    runtime = createRuntime(userId)
    runtimes.set(userId, new WeakRef(runtime))
    collectedRuntimes.register(runtime, userId)
  }
  return runtime
}
