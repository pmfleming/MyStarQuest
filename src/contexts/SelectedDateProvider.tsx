import { useCallback, useEffect, useMemo, useState } from 'react'
import { getNightlyResetKey } from '../lib/nightlyReset'
import { buildDateKey, getTodayDescriptor, parseDateKey } from '../lib/today'
import {
  SelectedDateContext,
  type SelectedDateContextValue,
} from './SelectedDateContext'

const getInitialSelectedDateKey = () => getTodayDescriptor().dateKey

export const SelectedDateProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [nightlyResetKey, setNightlyResetKey] = useState(getNightlyResetKey)
  const [selectedDateKey, setSelectedDateKeyState] = useState(
    getInitialSelectedDateKey
  )

  const setSelectedDateKey = useCallback((dateKey: string) => {
    setSelectedDateKeyState(dateKey)
  }, [])

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateKeyState(buildDateKey(date))
  }, [])

  const resetSelectedDate = useCallback(() => {
    setSelectedDateKeyState(getInitialSelectedDateKey())
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const checkReset = () => {
      window.clearTimeout(timer)
      const current = getNightlyResetKey()
      if (current !== nightlyResetKey) {
        setNightlyResetKey(current)
        resetSelectedDate()
      }
      timer = window.setTimeout(checkReset, 60_000 - (Date.now() % 60_000))
    }
    window.addEventListener('focus', checkReset)
    window.addEventListener('pageshow', checkReset)
    document.addEventListener('visibilitychange', checkReset)
    checkReset()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', checkReset)
      window.removeEventListener('pageshow', checkReset)
      document.removeEventListener('visibilitychange', checkReset)
    }
  }, [nightlyResetKey, resetSelectedDate])

  const value = useMemo<SelectedDateContextValue>(
    () => ({
      nightlyResetKey,
      selectedDateKey,
      selectedDate: parseDateKey(selectedDateKey),
      setSelectedDateKey,
      setSelectedDate,
      resetSelectedDate,
    }),
    [
      nightlyResetKey,
      selectedDateKey,
      setSelectedDateKey,
      setSelectedDate,
      resetSelectedDate,
    ]
  )

  return (
    <SelectedDateContext.Provider value={value}>
      {children}
    </SelectedDateContext.Provider>
  )
}
