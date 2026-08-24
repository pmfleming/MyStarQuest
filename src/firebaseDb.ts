import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { app } from './firebase'

const supportsPersistentCache =
  typeof window !== 'undefined' && 'indexedDB' in window

export const db = initializeFirestore(
  app,
  supportsPersistentCache
    ? {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }
    : {}
)
