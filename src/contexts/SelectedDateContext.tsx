import { createContext, useMemo } from 'react'
import {
  DEFAULT_LOCATION,
  getSolarTimes,
  type SolarLocation,
} from '../lib/solar'
import { useRequiredContext } from '../hooks/useRequiredContext'

export type SelectedDateContextValue = {
  selectedDateKey: string
  selectedDate: Date
  setSelectedDateKey: (dateKey: string) => void
  setSelectedDate: (date: Date) => void
  resetSelectedDate: () => void
}

export const SelectedDateContext = createContext<
  SelectedDateContextValue | undefined
>(undefined)

export const useSelectedDate = () => {
  return useRequiredContext(
    SelectedDateContext,
    'useSelectedDate',
    'SelectedDateProvider'
  )
}

export const useSolarTimes = (location: SolarLocation = DEFAULT_LOCATION) => {
  const { selectedDate } = useSelectedDate()

  return useMemo(
    () => getSolarTimes(selectedDate, location),
    [location, selectedDate]
  )
}
