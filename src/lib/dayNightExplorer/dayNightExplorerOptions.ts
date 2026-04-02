import type { SolarLocation } from '../solar'
import { DEFAULT_LOCATION } from '../solar'
import amsterdamCitySvg from '../../assets/cities/amsterdam.svg'
import dublinCitySvg from '../../assets/cities/dublin.svg'
import earthCitySvg from '../../assets/cities/earth.svg'
import sunCitySvg from '../../assets/cities/sun.svg'
import taipeiCitySvg from '../../assets/cities/taipei.svg'

export type ExplorerFocusId =
  | 'sun'
  | 'earth'
  | 'amsterdam'
  | 'dublin'
  | 'taipei'
export type ExplorerCityId = Exclude<ExplorerFocusId, 'sun' | 'earth'>
export type ExplorerRenderMode = 'rotating-earth' | 'moving-terminator'
export type ExplorerDisplayMode = 'earth-focus' | 'solar-focus'

export type ExplorerFocusOption = {
  id: ExplorerFocusId
  label: string
  icon: string
}

export type ExplorerCityOption = ExplorerFocusOption & {
  id: ExplorerCityId
  location: SolarLocation
  color: string
  angle: number
  ttl: number
  strokeWidth: number
}

export const EXPLORER_CITY_OPTIONS: ExplorerCityOption[] = [
  {
    id: 'amsterdam',
    label: 'Amsterdam',
    icon: amsterdamCitySvg,
    location: DEFAULT_LOCATION,
    color: '#ff8c00',
    angle: 20,
    ttl: 3200,
    strokeWidth: 4,
  },
  {
    id: 'dublin',
    label: 'Dublin',
    icon: dublinCitySvg,
    location: {
      latitude: 53.35,
      longitude: -6.26,
      timeZone: 'Europe/Dublin',
    },
    color: '#00aaff',
    angle: 16,
    ttl: 2600,
    strokeWidth: 3,
  },
  {
    id: 'taipei',
    label: 'Taipei',
    icon: taipeiCitySvg,
    location: {
      latitude: 25.03,
      longitude: 121.56,
      timeZone: 'Asia/Taipei',
    },
    color: '#ff3b30',
    angle: 16,
    ttl: 2600,
    strokeWidth: 3,
  },
]

export const EXPLORER_FOCUS_OPTIONS: ExplorerFocusOption[] = [
  {
    id: 'sun',
    label: 'Sun',
    icon: sunCitySvg,
  },
  {
    id: 'earth',
    label: 'Earth',
    icon: earthCitySvg,
  },
  ...EXPLORER_CITY_OPTIONS,
]

export const getExplorerCityOption = (cityId: ExplorerCityId) => {
  const cityOption = EXPLORER_CITY_OPTIONS.find(
    (option) => option.id === cityId
  )

  if (!cityOption) {
    throw new Error(`Unknown explorer city: ${cityId}`)
  }

  return cityOption
}

export const getExplorerFocusOption = (focusId: ExplorerFocusId) => {
  const focusOption = EXPLORER_FOCUS_OPTIONS.find(
    (option) => option.id === focusId
  )

  if (!focusOption) {
    throw new Error(`Unknown explorer focus: ${focusId}`)
  }

  return focusOption
}
