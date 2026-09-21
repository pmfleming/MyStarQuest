import { useCallback, useState } from 'react'
import type { DocumentData } from 'firebase/firestore'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { getTodayDescriptor } from '../lib/today'
import { reconcileTaskEphemeral, useTodayInfo } from './dailyTaskState'
import {
  sortByCreatedAtThenTitle,
  type TaskEphemeralState,
  type TaskRecord,
} from './types'
import { useUserCollection } from './useUserCollection'
import { isOfflineEnabled } from '../offline/platform'
import { offlineRuntime } from '../offline/runtime'
import { activityKey } from '../offline/model'

type ChildTaskCollectionItem = Pick<TaskRecord, 'id' | 'createdAt' | 'title'>

type UseChildTaskCollectionArgs<T extends ChildTaskCollectionItem> = {
  collectionName: 'chores' | 'tests'
  parseDocument: (id: string, data: DocumentData) => T | null
  getPersistedState?: (item: T, dateKey: string) => TaskEphemeralState
}

export const useChildTaskCollection = <T extends ChildTaskCollectionItem>({
  collectionName,
  parseDocument,
  getPersistedState,
}: UseChildTaskCollectionArgs<T>) => {
  const { user } = useAuth()
  const userId = user?.uid
  const { activeChildId } = useActiveChild()
  const todayInfo = useTodayInfo()
  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const normalizeItems = useCallback(
    (items: T[]) => [...items].sort(sortByCreatedAtThenTitle),
    []
  )
  const onClear = useCallback(() => setEphemeral({}), [])
  const onItems = useCallback(
    (items: T[]) => {
      // Keep optimistic changes until their fields arrive in a subscription snapshot.
      const dateKey = getTodayDescriptor().dateKey
      if (isOfflineEnabled() && userId) {
        const state = offlineRuntime(userId).store.getSnapshot()
        const next = Object.fromEntries(
          items.map((item) => [
            item.id,
            {
              ...(getPersistedState ? getPersistedState(item, dateKey) : {}),
              ...state?.activities[
                activityKey(collectionName, item.id, dateKey)
              ]?.patch,
            },
          ])
        )
        setEphemeral((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next
        )
        return
      }
      const persisted = getPersistedState
        ? items.map((item) => ({
            id: item.id,
            ...getPersistedState(item, dateKey),
          }))
        : items
      setEphemeral((previous) => reconcileTaskEphemeral(previous, persisted))
    },
    [collectionName, getPersistedState, userId]
  )

  const items = useUserCollection({
    userId: activeChildId ? user?.uid : undefined,
    collectionName,
    whereEqualToField: 'childId',
    whereEqualToValue: activeChildId ?? undefined,
    errorMessage: `Failed to subscribe to ${collectionName}`,
    mapDocument: parseDocument,
    normalizeItems,
    onClear,
    onItems,
  })
  return { items, user, activeChildId, todayInfo, ephemeral, setEphemeral }
}
