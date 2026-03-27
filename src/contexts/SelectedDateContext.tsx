import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
/* eslint-disable react-refresh/only-export-components */
import {
  DEFAULT_LOCATION,
  getSolarTimes,
  type SolarLocation,
} from '../lib/solar'
import { buildDateKey, getTodayDescriptor, parseDateKey } from '../lib/today'

type SelectedDateContextValue = {
  selectedDateKey: string
  selectedDate: Date
  setSelectedDateKey: (dateKey: string) => void
  setSelectedDate: (date: Date) => void
  resetSelectedDate: () => void
}

const SelectedDateContext = createContext<SelectedDateContextValue | undefined>(
  undefined
)

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

export const useSelectedDate = () => {
  const context = useContext(SelectedDateContext)

  if (!context) {
    throw new Error(
      'useSelectedDate must be used within a SelectedDateProvider'
    )
  }

  return context
}

export const useSolarTimes = (location: SolarLocation = DEFAULT_LOCATION) => {
  const { selectedDate } = useSelectedDate()

  return useMemo(
    () => getSolarTimes(selectedDate, location),
    [
      location.latitude,
      location.longitude,
      location.timeZone,
      selectedDate,
    ]
  )
}
