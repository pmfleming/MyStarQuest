import { useEffect, useState } from 'react'
import { getMealPeriod } from '../lib/mealTime'

/** Refresh at minute boundaries and immediately when returning to the app. */
export function useMealPeriod(timeZone?: string) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let timer: number | undefined
    const refresh = () => {
      window.clearTimeout(timer)
      if (document.hidden) return
      const current = Date.now()
      setNow(current)
      timer = window.setTimeout(refresh, 60_000 - (current % 60_000))
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return getMealPeriod(new Date(now), timeZone)
}
