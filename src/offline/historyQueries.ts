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
  const sources = new Map<string, Record<string, LocalDocument>>()
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
              if (
                authoritative.has(sourceKey) &&
                !snapshot.metadata.fromCache &&
                snapshot.docChanges?.().length === 0
              )
                return
              if (snapshot.metadata.fromCache) authoritative.delete(sourceKey)
              else authoritative.add(sourceKey)
              sources.set(
                sourceKey,
                Object.fromEntries(
                  snapshot.docs.map((doc) => {
                    const data = localDocument(doc.data())
                    return [key(doc.id, data), data]
                  })
                )
              )
              if (sources.size === expectedSources)
                receive(
                  Object.assign({}, ...sources.values()),
                  authoritative.size !== expectedSources
                )
            },
            onError
          )
        )
      }
    }
  } catch (error) {
    stops.forEach((stop) => stop())
    throw error
  }
  return () => stops.forEach((stop) => stop())
}
