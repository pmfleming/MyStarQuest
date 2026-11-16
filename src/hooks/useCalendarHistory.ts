import { useCallback, useMemo, useState } from 'react'
import { useDataScope } from '../sharing/ChildAccessContext'
import { useUserCollection } from '../data/useUserCollection'
import {
  buildCalendarHistory,
  type HistoryPeriod,
} from '../lib/calendarHistory'
import {
  calendarHistoryWindow,
  type HistoryWindow,
} from '../offline/historyRetention'
import { getTodayDescriptor } from '../lib/today'
import type { ReadCollection } from '../offline/model'

const mapDocument = (id: string, data: Record<string, unknown>) => ({
  id,
  data,
})
function useHistoryCollection(
  name: ReadCollection,
  storageKey: string | undefined,
  childId: string | null,
  historyWindow?: HistoryWindow
) {
  const key = `${storageKey}/${childId}/${name}/${historyWindow?.start}/${historyWindow?.end}`
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
    historyWindow,
  })
  return {
    items,
    loading: !!storageKey && !!childId && status.key !== key,
    error: status.key === key && status.error,
  }
}
export function useCalendarHistory(
  dateKey = getTodayDescriptor().dateKey,
  period: HistoryPeriod = 'month'
) {
  const { storageKey, childId, timeZone } = useDataScope()
  const window = calendarHistoryWindow(dateKey, period)
  const events = useHistoryCollection('starEvents', storageKey, childId, window)
  const redemptions = useHistoryCollection(
    'redemptions',
    storageKey,
    childId,
    window
  )
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
