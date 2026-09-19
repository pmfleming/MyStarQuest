import { useEffect, useState } from 'react'
import {
  CALENDAR_SCHEDULE_CHANGED,
  CALENDAR_SCHEDULE_STORAGE_KEY,
  loadCalendarSchedule,
} from '../lib/calendarSchedule'

export const useCalendarSchedule = () => {
  const [schedule, setSchedule] = useState(loadCalendarSchedule)
  useEffect(() => {
    const reload = () => setSchedule(loadCalendarSchedule())
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CALENDAR_SCHEDULE_STORAGE_KEY)
        reload()
    }
    window.addEventListener(CALENDAR_SCHEDULE_CHANGED, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CALENDAR_SCHEDULE_CHANGED, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return schedule
}
