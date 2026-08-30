import { useCallback } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useCoalescedDocumentUpdates } from '../hooks/useCoalescedDocumentUpdates'

type UserDocumentUpdateOptions = {
  userId?: string
  collectionName: string
  errorMessage: string
}

export const useUserDocumentUpdates = <Patch extends object>({
  userId,
  collectionName,
  errorMessage,
}: UserDocumentUpdateOptions) => {
  const persistUpdate = useCallback(
    async (id: string, patch: Patch) => {
      if (!userId) return
      await updateDoc(doc(db, 'users', userId, collectionName, id), patch)
    },
    [collectionName, userId]
  )

  const coalescedUpdates = useCoalescedDocumentUpdates<Patch>({
    persist: persistUpdate,
    onError: (id, _patch, error) => {
      console.error(`${errorMessage}: ${id}`, error)
    },
  })

  return {
    persistUpdate,
    ...coalescedUpdates,
  }
}
