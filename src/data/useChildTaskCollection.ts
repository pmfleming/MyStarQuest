import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { DocumentData } from 'firebase/firestore'
import { sortByCreatedAtThenTitle } from './types'
import { useUserCollection } from './useUserCollection'

type ChildTaskCollectionItem = {
  createdAt?: Date
  title: string
}

type UseChildTaskCollectionArgs<T extends ChildTaskCollectionItem, E> = {
  userId: string | undefined
  activeChildId: string | null
  collectionName: 'chores' | 'tests'
  errorMessage: string
  parseDocument: (id: string, data: DocumentData) => T | null
  clearEphemeral: Dispatch<SetStateAction<Record<string, E>>>
}

export const useChildTaskCollection = <T extends ChildTaskCollectionItem, E>({
  userId,
  activeChildId,
  collectionName,
  errorMessage,
  parseDocument,
  clearEphemeral,
}: UseChildTaskCollectionArgs<T, E>) => {
  const mapDocument = useCallback(
    (id: string, data: DocumentData) => parseDocument(id, data),
    [parseDocument]
  )
  const normalizeItems = useCallback(
    (items: T[]) => [...items].sort(sortByCreatedAtThenTitle),
    []
  )
  const onClear = useCallback(() => clearEphemeral({}), [clearEphemeral])

  return useUserCollection({
    userId: activeChildId ? userId : undefined,
    collectionName,
    whereEqualToField: 'childId',
    whereEqualToValue: activeChildId ?? undefined,
    errorMessage,
    mapDocument,
    normalizeItems,
    onClear,
  })
}
