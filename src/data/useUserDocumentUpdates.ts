import { useCallback } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isOfflineEnabled } from '../offline/platform'
import { saveDocument } from '../offline/actions'
import { offlineRuntime } from '../offline/runtime'
import type { CollectionName, LocalDocument } from '../offline/model'
import { useCoalescedDocumentUpdates } from '../hooks/useCoalescedDocumentUpdates'

export async function deleteUserDocument(
  userId: string,
  collectionName: CollectionName,
  id: string
) {
  if (isOfflineEnabled())
    await saveDocument(userId, collectionName, id, 'delete')
  else await deleteDoc(doc(db, 'users', userId, collectionName, id))
}

export async function createUserDocument(
  userId: string,
  collectionName: CollectionName,
  data: LocalDocument
) {
  if (isOfflineEnabled())
    return saveDocument(
      userId,
      collectionName,
      crypto.randomUUID(),
      'put',
      data
    )
  await addDoc(collection(db, 'users', userId, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

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
      if (isOfflineEnabled())
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
    delayMs: isOfflineEnabled() ? 0 : undefined,
    onError: (id, _patch, error) => {
      console.error(`${errorMessage}: ${id}`, error)
      if (isOfflineEnabled() && userId) offlineRuntime(userId).report(error)
    },
  })

  return {
    persistUpdate,
    ...coalescedUpdates,
  }
}
