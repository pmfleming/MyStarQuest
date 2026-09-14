import { useCallback } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isAndroidOffline } from '../offline/platform'
import { saveDocument } from '../offline/actions'
import { offlineRuntime } from '../offline/runtime'
import type { CollectionName } from '../offline/model'
import { useCoalescedDocumentUpdates } from '../hooks/useCoalescedDocumentUpdates'

type UserDocumentUpdateOptions = {
  userId?: string
  collectionName: CollectionName
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
      if (isAndroidOffline())
        return saveDocument(
          userId,
          collectionName,
          id,
          'patch',
          Object.fromEntries(Object.entries(patch))
        )
      await updateDoc(doc(db, 'users', userId, collectionName, id), patch)
    },
    [collectionName, userId]
  )

  const coalescedUpdates = useCoalescedDocumentUpdates<Patch>({
    persist: persistUpdate,
    delayMs: isAndroidOffline() ? 0 : undefined,
    onError: (id, _patch, error) => {
      console.error(`${errorMessage}: ${id}`, error)
      if (isAndroidOffline() && userId) offlineRuntime(userId).report(error)
    },
  })

  return {
    persistUpdate,
    ...coalescedUpdates,
  }
}
