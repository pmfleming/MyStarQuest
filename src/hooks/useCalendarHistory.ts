import { useCallback, useMemo, useState } from 'react'
import { useDataScope } from '../sharing/ChildAccessContext'
import { useUserCollection } from '../data/useUserCollection'
import { buildCalendarHistory } from '../lib/calendarHistory'
import type { ReadCollection } from '../offline/model'

const mapDocument = (id: string, data: Record<string, unknown>) => ({
  id,
  data,
})
function useHistoryCollection(
  name: ReadCollection,
  storageKey: string | undefined,
  childId: string | null
) {
  const key = `${storageKey}/${childId}/${name}`
  const [status, setStatus] = useState({ key: '', error: false })
  const onItems = useCallback(() => setStatus({ key, error: false }), [key])
  const onError = useCallback(() => setStatus({ key, error: true }), [key])
  const items = useUserCollection({
    userId: childId ? storageKey : undefined,
    collectionName: name,
    whereEqualToField: name === 'rewards' ? undefined : 'childId',
    whereEqualToValue: childId ?? undefined,
    mapDocument,
    errorMessage: `Failed to load calendar ${name}`,
    onItems,
    onError,
  })
  return {
    items,
    loading: !!storageKey && !!childId && status.key !== key,
    error: status.key === key && status.error,
  }
}
export function useCalendarHistory() {
  const { storageKey, childId, timeZone } = useDataScope()
  const events = useHistoryCollection('starEvents', storageKey, childId)
  const redemptions = useHistoryCollection('redemptions', storageKey, childId)
  const chores = useHistoryCollection('chores', storageKey, childId)
  const tests = useHistoryCollection('tests', storageKey, childId)
  const rewards = useHistoryCollection('rewards', storageKey, childId)
  const entries = useMemo(
    () =>
      buildCalendarHistory(
        events.items,
        redemptions.items,
        chores.items,
        tests.items,
        rewards.items,
        timeZone
      ),
    [
      events.items,
      redemptions.items,
      chores.items,
      tests.items,
      rewards.items,
      timeZone,
    ]
  )
  return {
    entries,
    childId,
    loading: events.loading || redemptions.loading,
    error: events.error || redemptions.error,
  }
}
