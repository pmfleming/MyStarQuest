import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type OrderByDirection,
} from 'firebase/firestore'
import { db } from '../firebase'

type UseUserCollectionArgs<T> = {
  userId: string | undefined
  collectionName: string
  orderByField?: string
  orderDirection?: OrderByDirection
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
  errorMessage,
  mapDocument,
  normalizeItems,
  onItems,
  onClear,
}: UseUserCollectionArgs<T>) => {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    if (!userId) {
      setItems([])
      onClear?.()
      return
    }

    const baseCollection = collection(db, 'users', userId, collectionName)
    const source = orderByField
      ? query(baseCollection, orderBy(orderByField, orderDirection))
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
  ])

  return items
}
