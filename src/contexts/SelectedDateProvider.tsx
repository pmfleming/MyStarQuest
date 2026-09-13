import { useCallback, useMemo, useState } from 'react'
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

  const value = useMemo<SelectedDateContextValue>(
    () => ({
      selectedDateKey,
      selectedDate: parseDateKey(selectedDateKey),
      setSelectedDateKey,
      setSelectedDate,
      resetSelectedDate,
    }),
    [selectedDateKey, setSelectedDateKey, setSelectedDate, resetSelectedDate]
  )

  return (
    <SelectedDateContext.Provider value={value}>
      {children}
    </SelectedDateContext.Provider>
  )
}
