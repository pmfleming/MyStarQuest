import {
  buildLocationDateTime,
  getLocationClockTime,
  type LocationClockTime,
  type SolarLocation,
} from '../../lib/solar'

// Equal month sectors match the labels drawn around the orbit.
export const getYearProgress = (date: Date) => {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate()
  return (date.getMonth() + (date.getDate() - 1) / daysInMonth) / 12
}

export const getDateAtOrbitProgress = (startYear: number, progress: number) => {
  const yearOffset = Math.floor(progress)
  const monthProgress = (progress - yearOffset) * 12
  const month = Math.min(11, Math.floor(monthProgress))
  const year = startYear + yearOffset
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Let Date carry the rounded last day into the next month/year so pointer
  // precision near a month label does not leave the calendar one day behind.
  const day = 1 + Math.round((monthProgress - month) * daysInMonth)
  return new Date(year, month, day)
}

export const getInitialExplorerClockTime = (
  location: SolarLocation
): LocationClockTime => {
  return getLocationClockTime(new Date(), location)
}

export const buildExplorerInstant = (
  selectedDate: Date,
  minutes: number,
  seconds: number,
  location: SolarLocation
) => {
  return buildLocationDateTime(selectedDate, minutes, seconds, location)
}

export const getClockTimeForInstant = (
  instant: Date,
  location: SolarLocation
): LocationClockTime => {
  return getLocationClockTime(instant, location)
}
