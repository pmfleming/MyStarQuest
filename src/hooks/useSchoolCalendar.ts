import { useEffect, useSyncExternalStore } from 'react'
import { schoolCalendarStore } from '../lib/schoolCalendarStore'

export const useSchoolCalendar = () => {
  const snapshot = useSyncExternalStore(
    schoolCalendarStore.subscribe,
    schoolCalendarStore.getSnapshot
  )
  useEffect(() => schoolCalendarStore.start(), [])
  return {
    events: snapshot.data,
    loadError: snapshot.loadError,
    retry: () => {
      void schoolCalendarStore.refresh(true)
    },
  }
}
