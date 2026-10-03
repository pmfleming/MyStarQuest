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
import { parseChildScope } from '../sharing/scope'

export async function deleteUserDocument(
  userId: string,
  collectionName: CollectionName,
  id: string
) {
  if (isOfflineEnabled() || parseChildScope(userId))
    await saveDocument(userId, collectionName, id, 'delete')
  else await deleteDoc(doc(db, 'users', userId, collectionName, id))
}

export async function createUserDocument(
  userId: string,
  collectionName: CollectionName,
  data: LocalDocument
) {
  if (isOfflineEnabled() || parseChildScope(userId))
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
  resolveUserId?: (id: string) => string | undefined
}

export const useUserDocumentUpdates = <Patch extends object>({
  userId,
  collectionName,
  errorMessage,
  resolveUserId,
}: UserDocumentUpdateOptions) => {
  const persistUpdate = useCallback(
    async (id: string, patch: Patch) => {
      const target = resolveUserId ? resolveUserId(id) : userId
      if (!target) return
      if (isOfflineEnabled() || parseChildScope(target))
        return saveDocument(
          target,
          collectionName,
          id,
          'patch',
          Object.fromEntries(Object.entries(patch))
        )
      await updateDoc(doc(db, 'users', target, collectionName, id), patch)
    },
    [collectionName, userId, resolveUserId]
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
