import {
  buildLocationDateTime,
  getLocationClockTime,
  type LocationClockTime,
  type SolarLocation,
} from '../../lib/solar'

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
