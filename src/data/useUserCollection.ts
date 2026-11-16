import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type OrderByDirection,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isOfflineEnabled } from '../offline/platform'
import { subscribeOfflineCollection } from '../offline/subscribeCollection'
import type { ReadCollection } from '../offline/model'
import { parseChildScope } from '../sharing/scope'
import { subscribeHistoryWindow } from '../offline/historyQueries'
import type { HistoryWindow } from '../offline/historyRetention'

type UseUserCollectionArgs<T> = {
  userId: string | undefined
  collectionName: ReadCollection
  orderByField?: string
  orderDirection?: OrderByDirection
  whereEqualToField?: string
  whereEqualToValue?: unknown
  errorMessage: string
  mapDocument: (id: string, data: DocumentData) => T | null
  normalizeItems?: (items: T[]) => T[]
  onItems?: (items: T[]) => void
  onClear?: () => void
  onError?: (error: unknown) => void
  historyWindow?: HistoryWindow
}

export const useUserCollection = <T>({
  userId,
  collectionName,
  orderByField,
  orderDirection = 'asc',
  whereEqualToField,
  whereEqualToValue,
  errorMessage,
  mapDocument,
  normalizeItems,
  onItems,
  onClear,
  onError,
  historyWindow,
}: UseUserCollectionArgs<T>) => {
  const historyStart = historyWindow?.start
  const historyEnd = historyWindow?.end
  const resultKey = JSON.stringify([
    userId,
    collectionName,
    whereEqualToField,
    whereEqualToValue,
    historyStart,
    historyEnd,
  ])
  const [result, setResult] = useState<{ key: string; items: T[] }>({
    key: resultKey,
    items: [],
  })

  useEffect(() => {
    const setItems = (items: T[]) => setResult({ key: resultKey, items })
    const publishDocuments = (
      documents: { id: string; data: DocumentData }[],
      ready = true
    ) => {
      const mapped = documents.flatMap(({ id, data }) => {
        const item = mapDocument(id, data)
        return item ? [item] : []
      })
      const nextItems = normalizeItems ? normalizeItems(mapped) : mapped
      setItems(nextItems)
      if (ready) onItems?.(nextItems)
    }
    if (!userId) {
      onClear?.()
      return
    }

    if (isOfflineEnabled() || parseChildScope(userId)) {
      return subscribeOfflineCollection({
        userId,
        collectionName,
        historyWindow:
          historyStart !== undefined && historyEnd !== undefined
            ? {
                start: historyStart,
                end: historyEnd,
                childId:
                  typeof whereEqualToValue === 'string'
                    ? whereEqualToValue
                    : undefined,
              }
            : undefined,
        receive: (documents, ready) =>
          publishDocuments(
            documents.filter(
              ({ data }) =>
                !whereEqualToField ||
                data[whereEqualToField] === whereEqualToValue
            ),
            ready
          ),
        onError,
      })
    }

    if (
      historyStart !== undefined &&
      historyEnd !== undefined &&
      (collectionName === 'starEvents' || collectionName === 'redemptions')
    ) {
      return subscribeHistoryWindow(
        userId,
        collectionName,
        { start: historyStart, end: historyEnd },
        (documents) =>
          publishDocuments(
            Object.entries(documents).map(([id, data]) => ({ id, data }))
          ),
        (error) => {
          onError?.(error)
          console.error(errorMessage, error)
        },
        typeof whereEqualToValue === 'string' ? whereEqualToValue : undefined
      )
    }

    const baseCollection = collection(db, 'users', userId, collectionName)
    const constraints = []
    if (whereEqualToField && whereEqualToValue !== undefined) {
      constraints.push(where(whereEqualToField, '==', whereEqualToValue))
    }
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection))
    }
    const source =
      constraints.length > 0
        ? query(baseCollection, ...constraints)
        : baseCollection

    return onSnapshot(
      source,
      (snapshot) => {
        publishDocuments(
          snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))
        )
      },
      (error) => {
        onError?.(error)
        console.error(errorMessage, error)
        setItems([])
        onClear?.()
      }
    )
  }, [
    collectionName,
    errorMessage,
    mapDocument,
    normalizeItems,
    onClear,
    onError,
    onItems,
    orderByField,
    orderDirection,
    userId,
    resultKey,
    whereEqualToField,
    whereEqualToValue,
    historyStart,
    historyEnd,
  ])

  return userId && result.key === resultKey ? result.items : []
}
