import type {
  ThemeActivityImages,
  ThemeExplorerBackgroundImages,
} from '../../contexts/ThemeContext'
import type { SolarTimes } from '../../lib/solar'
import type { Season } from '../../lib/seasons'
import { explorerUi } from './dayNightExplorer.constants.ts'
import { normalizeMinutes } from './dayNightExplorerMath'
import {
  getActivityAtMinute,
  type AgendaItem,
} from '../../lib/calendarSchedule'

type RgbColor = {
  r: number
  g: number
  b: number
}

export type ExplorerBackgroundKey = keyof ThemeExplorerBackgroundImages

const EXPLORER_SKY_COLORS: Record<ExplorerBackgroundKey, RgbColor> = {
  night: { r: 56, g: 78, b: 140 },
  sunrise: { r: 255, g: 196, b: 143 },
  daytime: { r: 135, g: 206, b: 250 },
  sunset: { r: 255, g: 166, b: 120 },
}

type ExplorerBackgroundBlend = {
  base: ExplorerBackgroundKey
  overlay: ExplorerBackgroundKey
  overlayOpacity: number
}

const interpolateColor = (from: RgbColor, to: RgbColor, amount: number) => {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  }
}

const getNightMidpointMinutes = (
  sunriseMinutes: number,
  sunsetMinutes: number
) => {
  const wrappedSunriseMinutes =
    sunriseMinutes <= sunsetMinutes
      ? sunriseMinutes + explorerUi.totalMinutes
      : sunriseMinutes

  return normalizeMinutes(
    sunsetMinutes + (wrappedSunriseMinutes - sunsetMinutes) / 2
  )
}

export const getImageForTime = (
  minutes: number,
  activityImages: ThemeActivityImages | undefined,
  agenda: AgendaItem[]
) => {
  if (!activityImages) {
    return null
  }

  const event = getActivityAtMinute(agenda, minutes)
  return event ? activityImages[event.activity] : null
}

export const getExplorerBackdropColor = (
  minutes: number,
  solarTimes: SolarTimes
) => {
  const { base, overlay, overlayOpacity } = getExplorerBackgroundBlend(
    minutes,
    solarTimes
  )
  const color = interpolateColor(
    EXPLORER_SKY_COLORS[base],
    EXPLORER_SKY_COLORS[overlay],
    overlayOpacity
  )
  return `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`
}

export const getExplorerBackgroundBlend = (
  minutes: number,
  solarTimes: SolarTimes
): ExplorerBackgroundBlend => {
  const normalizedMinutes = normalizeMinutes(minutes)
  const nightMidpointMinutes = getNightMidpointMinutes(
    solarTimes.sunriseMinutes,
    solarTimes.sunsetMinutes
  )
  const adjustedMinutes =
    normalizedMinutes < solarTimes.sunriseMinutes
      ? normalizedMinutes + explorerUi.totalMinutes
      : normalizedMinutes

  const imageStops: Array<{
    minute: number
    key: ExplorerBackgroundKey
  }> = [
    { minute: nightMidpointMinutes - explorerUi.totalMinutes, key: 'night' },
    { minute: solarTimes.sunriseMinutes, key: 'sunrise' },
    { minute: solarTimes.daylightStartMinutes, key: 'daytime' },
    { minute: solarTimes.daylightEndMinutes, key: 'daytime' },
    { minute: solarTimes.sunsetMinutes, key: 'sunset' },
    { minute: nightMidpointMinutes + explorerUi.totalMinutes, key: 'night' },
  ]

  for (let i = 0; i < imageStops.length - 1; i++) {
    const currentStop = imageStops[i]
    const nextStop = imageStops[i + 1]
    if (!currentStop || !nextStop) continue

    if (
      adjustedMinutes >= currentStop.minute &&
      adjustedMinutes <= nextStop.minute
    ) {
      const segmentDuration = nextStop.minute - currentStop.minute || 1
      const mix = (adjustedMinutes - currentStop.minute) / segmentDuration

      return {
        base: currentStop.key,
        overlay: nextStop.key,
        overlayOpacity: mix,
      }
    }
  }

  return {
    base: 'night',
    overlay: 'night',
    overlayOpacity: 0,
  }
}

export const resolveBackgroundImage = (
  images: ThemeExplorerBackgroundImages | undefined,
  key: ExplorerBackgroundKey,
  season: Season
) => {
  if (!images) {
    return null
  }

  const image = images[key]
  return typeof image === 'string' ? image : image[season]
}
