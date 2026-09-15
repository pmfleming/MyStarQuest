import {
  doc,
  runTransaction,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { auth } from '../firebase'
import { applyOperation } from './transport'
import type { SendOperation } from './sync'
import { recordData, type LocalDocument } from './model'

// Convert SDK timestamp instances to cloneable Dates before saving IndexedDB.
export function localDocument(data: DocumentData): LocalDocument {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, localValue(value)])
  )
}
function localValue(value: unknown): unknown {
  if (!value || typeof value !== 'object' || value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(localValue)
  return localDocument(recordData(value))
}
export function snapshotDocument(data: LocalDocument): DocumentData {
  return {
    ...data,
    ...(data.createdAt instanceof Date
      ? { createdAt: { toDate: () => data.createdAt } }
      : {}),
  }
}

export const sendToFirebase: SendOperation = (userId, operation) => {
  if (auth.currentUser?.uid !== userId)
    return Promise.reject(
      Object.assign(new Error('Sign in to sync this account.'), {
        code: 'unauthenticated',
      })
    )
  return runTransaction(db, (transaction) =>
    applyOperation(
      {
        get: async (path) => {
          const snapshot = await transaction.get(doc(db, path))
          return snapshot.exists() ? localDocument(snapshot.data()) : undefined
        },
        set: (path, data) => transaction.set(doc(db, path), data),
        delete: (path) => transaction.delete(doc(db, path)),
      },
      userId,
      operation
    )
  )
}
