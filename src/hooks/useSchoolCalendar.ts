import { useEffect, useState } from 'react'
import {
  loadSchoolCalendar,
  type SchoolCalendarData,
} from '../lib/schoolCalendarData'

export const useSchoolCalendar = () => {
  const [events, setEvents] = useState<SchoolCalendarData>({})
  const [loadError, setLoadError] = useState(false)
  const [request, setRequest] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void loadSchoolCalendar(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setEvents(data)
        setLoadError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [request])
  return {
    events,
    loadError,
    retry: () => {
      setLoadError(false)
      setRequest((value) => value + 1)
    },
  }
}
