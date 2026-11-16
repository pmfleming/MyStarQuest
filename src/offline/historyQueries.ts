import {
  collection,
  onSnapshot,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { parseChildScope } from '../sharing/scope'
import { localDocument } from './firebaseTransport'
import type { HistoryCollection, LocalDocument } from './model'
import type { HistoryWindow } from './historyRetention'
import { sameValue } from './changes'

export function historySources(
  userId: string,
  name: HistoryCollection,
  childId?: string
) {
  const scope = parseChildScope(userId)
  const owner = scope?.ownerUid ?? userId
  const legacy = collection(db, `users/${owner}/${name}`)
  const child = scope?.childId ?? childId
  const root = child ? query(legacy, where('childId', '==', child)) : legacy
  return scope
    ? [
        { source: root, key: (id: string) => `legacy-${id}` },
        {
          source: collection(
            db,
            `users/${owner}/children/${scope.childId}/${name}`
          ),
          key: (id: string, data: LocalDocument) =>
            String(data.operationId ?? id),
        },
      ]
    : [
        {
          source: root,
          key: (id: string, data: LocalDocument) =>
            String(data.operationId ?? id),
        },
      ]
}

// Historical clients wrote both Firestore timestamps and numeric milliseconds.
// Separate typed ranges cover both without downloading the account's lifetime log.
export function subscribeHistoryWindow(
  userId: string,
  name: HistoryCollection,
  window: HistoryWindow,
  receive: (
    documents: Record<string, LocalDocument>,
    fromCache: boolean
  ) => void,
  onError: (error: unknown) => void,
  childId?: string
) {
  const stops: (() => void)[] = []
  const sources = new Map<string, Map<string, [string, LocalDocument]>>()
  const authoritative = new Set<string>()
  const querySources = historySources(userId, name, childId)
  const ranges: [string, number | string | Date, number | string | Date][] = [
    ['createdAt', window.start, window.end],
    ['createdAt', new Date(window.start), new Date(window.end)],
    ['occurredAt', window.start, window.end],
    [
      'dateKey',
      new Date(window.start).toISOString().slice(0, 10),
      new Date(window.end).toISOString().slice(0, 10),
    ],
  ]
  const expectedSources = querySources.length * ranges.length
  let timer: ReturnType<typeof setTimeout> | undefined
  let previous: Record<string, LocalDocument> | undefined
  let previouslyCached: boolean | undefined
  const publish = () => {
    timer = undefined
    const combined = new Map<string, LocalDocument>()
    for (const source of sources.values()) {
      for (const [key, data] of source.values()) combined.set(key, data)
    }
    const documents = Object.fromEntries(combined)
    const fromCache = authoritative.size !== expectedSources
    if (previouslyCached === fromCache && sameValue(previous, documents)) return
    previous = documents
    previouslyCached = fromCache
    receive(documents, fromCache)
  }
  const stop = () => {
    clearTimeout(timer)
    stops.forEach((unsubscribe) => unsubscribe())
  }
  try {
    for (const [sourceIndex, { source, key }] of querySources.entries()) {
      for (const [rangeIndex, [field, start, end]] of ranges.entries()) {
        const constraints: QueryConstraint[] = [
          where(field, '>=', start),
          where(field, '<', end),
        ]
        const sourceKey = `${sourceIndex}/${rangeIndex}`
        stops.push(
          onSnapshot(
            query(source, ...constraints),
            { includeMetadataChanges: true },
            (snapshot) => {
              let known = sources.get(sourceKey)
              const changes = known ? snapshot.docChanges() : undefined
              const wasAuthoritative = authoritative.has(sourceKey)
              if (snapshot.metadata.fromCache) authoritative.delete(sourceKey)
              else authoritative.add(sourceKey)
              if (!known) {
                known = new Map()
                sources.set(sourceKey, known)
                for (const doc of snapshot.docs) {
                  const data = localDocument(doc.data())
                  known.set(doc.id, [key(doc.id, data), data])
                }
              } else {
                for (const { type, doc } of changes ?? []) {
                  if (type === 'removed') known.delete(doc.id)
                  else {
                    const data = localDocument(doc.data())
                    known.set(doc.id, [key(doc.id, data), data])
                  }
                }
                if (
                  !changes?.length &&
                  wasAuthoritative === !snapshot.metadata.fromCache
                )
                  return
              }
              if (sources.size === expectedSources && timer === undefined)
                timer = setTimeout(publish, 0)
            },
            onError
          )
        )
      }
    }
  } catch (error) {
    stop()
    throw error
  }
  return stop
}
