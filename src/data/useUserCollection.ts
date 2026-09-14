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
import { isAndroidOffline } from '../offline/platform'
import { offlineRuntime } from '../offline/runtime'
import type { CollectionName } from '../offline/model'

type UseUserCollectionArgs<T> = {
  userId: string | undefined
  collectionName: CollectionName
  orderByField?: string
  orderDirection?: OrderByDirection
  whereEqualToField?: string
  whereEqualToValue?: unknown
  errorMessage: string
  mapDocument: (id: string, data: DocumentData) => T | null
  normalizeItems?: (items: T[]) => T[]
  onItems?: (items: T[]) => void
  onClear?: () => void
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
}: UseUserCollectionArgs<T>) => {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    if (!userId) {
      onClear?.()
      return
    }

    if (isAndroidOffline()) {
      const runtime = offlineRuntime(userId)
      const publish = () => {
        const mapped = runtime
          .documents(collectionName)
          .flatMap(({ id, data }) => {
            if (
              whereEqualToField &&
              data[whereEqualToField] !== whereEqualToValue
            )
              return []
            const item = mapDocument(id, data)
            return item ? [item] : []
          })
        const nextItems = normalizeItems ? normalizeItems(mapped) : mapped
        setItems(nextItems)
        onItems?.(nextItems)
      }
      const unsubscribe = runtime.store.subscribe(publish)
      void runtime.store.open().then(publish).catch(runtime.report)
      // Refresh day-scoped progress while open, and immediately after resuming.
      const interval = setInterval(publish, 30_000)
      document.addEventListener('visibilitychange', publish)
      return () => {
        unsubscribe()
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
        const mappedItems = snapshot.docs.flatMap((docSnapshot) => {
          const item = mapDocument(docSnapshot.id, docSnapshot.data())
          return item ? [item] : []
        })
        const nextItems = normalizeItems
          ? normalizeItems(mappedItems)
          : mappedItems

        setItems(nextItems)
        onItems?.(nextItems)
      },
      (error) => {
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
    onItems,
    orderByField,
    orderDirection,
    userId,
    whereEqualToField,
    whereEqualToValue,
  ])

  return userId ? items : []
}
