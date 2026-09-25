import {
  EXPLORER_CITY_OPTIONS,
  type ExplorerCityId,
} from './dayNightExplorerOptions'

type Coordinates = Pick<GeolocationCoordinates, 'latitude' | 'longitude'>
const radians = (degrees: number) => (degrees * Math.PI) / 180

export function getNearbyExplorerCity(coords: Coordinates): ExplorerCityId {
  const nearby = EXPLORER_CITY_OPTIONS.find(({ location }) => {
    const latitude = radians(coords.latitude - location.latitude)
    const longitude = radians(coords.longitude - location.longitude)
    const haversine =
      Math.sin(latitude / 2) ** 2 +
      Math.cos(radians(coords.latitude)) *
        Math.cos(radians(location.latitude)) *
        Math.sin(longitude / 2) ** 2
    // Include the surrounding metro area and airports, within 50 km.
    return 2 * 6371 * Math.asin(Math.sqrt(haversine)) <= 50
  })
  return nearby?.id ?? 'amsterdam'
}

export function getCurrentExplorerCity(): Promise<ExplorerCityId> {
  return new Promise((resolve) => {
    const finish = (city: ExplorerCityId = 'amsterdam') => {
      window.clearTimeout(timer)
      resolve(city)
    }
    // Also bound permission prompts that may outlive the browser's GPS timeout.
    const timer = window.setTimeout(finish, 10_000)
    try {
      if (!navigator.geolocation) return finish()
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => finish(getNearbyExplorerCity(coords)),
        () => finish(),
        { maximumAge: 0, timeout: 10_000, enableHighAccuracy: false }
      )
    } catch {
      finish()
    }
  })
}
