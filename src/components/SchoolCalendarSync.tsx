import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { afterFirstPaint } from '../lib/afterFirstPaint'

// Keep validation, the calendar seed and native bridge out of the login graph.
// Android's native worker is scheduled independently by MainActivity.
export default function SchoolCalendarSync() {
  const { user } = useAuth()
  const signedIn = Boolean(user)
  useEffect(() => {
    if (!signedIn) return
    let disposed = false
    let stop: (() => void) | undefined
    const cancel = afterFirstPaint(() => {
      void import('../lib/schoolCalendarStore')
        .then(({ schoolCalendarStore }) => {
          if (!disposed) stop = schoolCalendarStore.start()
        })
        .catch(() => {
          /* The calendar screen can retry loading its own module. */
        })
    })
    return () => {
      disposed = true
      cancel()
      stop?.()
    }
  }, [signedIn])
  return null
}
