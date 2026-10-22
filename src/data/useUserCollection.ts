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
import { offlineRuntime } from '../offline/runtime'
import type { ReadCollection } from '../offline/model'
import { parseChildScope } from '../sharing/scope'

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
}: UseUserCollectionArgs<T>) => {
  const resultKey = JSON.stringify([
    userId,
    collectionName,
    whereEqualToField,
    whereEqualToValue,
  ])
  const [result, setResult] = useState<{ key: string; items: T[] }>({
    key: resultKey,
    items: [],
  })

  useEffect(() => {
    const setItems = (items: T[]) => setResult({ key: resultKey, items })
    const publishDocuments = (
      documents: { id: string; data: DocumentData }[]
    ) => {
      const mapped = documents.flatMap(({ id, data }) => {
        const item = mapDocument(id, data)
        return item ? [item] : []
      })
      const nextItems = normalizeItems ? normalizeItems(mapped) : mapped
      setItems(nextItems)
      onItems?.(nextItems)
    }
    if (!userId) {
      onClear?.()
      return
    }

    if (isOfflineEnabled() || parseChildScope(userId)) {
      const runtime = offlineRuntime(userId)
      let disposed = false
      const publish = () => {
        if (disposed) return
        publishDocuments(
          runtime
            .documents(collectionName)
            .filter(
              ({ data }) =>
                !whereEqualToField ||
                data[whereEqualToField] === whereEqualToValue
            )
        )
      }
      const unsubscribeErrors = runtime.subscribeErrors(() => {
        const error = runtime.getError()
        if (error) onError?.(error)
      })
      const unsubscribe = runtime.store.subscribe(publish)
      void runtime.store
        .open()
        .then(publish)
        .catch((error) => {
          runtime.report(error)
          onError?.(error)
        })
      // Refresh day-scoped progress while open, and immediately after resuming.
      const interval = setInterval(publish, 30_000)
      document.addEventListener('visibilitychange', publish)
      return () => {
        disposed = true
        unsubscribe()
        unsubscribeErrors()
        clearInterval(interval)
        document.removeEventListener('visibilitychange', publish)
      }
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
  ])

  return userId && result.key === resultKey ? result.items : []
}
