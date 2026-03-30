import type {
  ThemeActivityImages,
  ThemeExplorerBackgroundImages,
} from '../../contexts/ThemeContext'
import type { SolarTimes } from '../solar'
import type { Season } from '../seasons'
import { explorerUi } from './dayNightExplorer.constants'
import { normalizeMinutes } from './dayNightExplorerMath'

type RgbColor = {
  r: number
  g: number
  b: number
}

export type ExplorerBackgroundKey = keyof ThemeExplorerBackgroundImages

const EXPLORER_SKY_COLORS = {
  night: { r: 56, g: 78, b: 140 },
  sunrise: { r: 255, g: 196, b: 143 },
  day: { r: 135, g: 206, b: 250 },
  sunset: { r: 255, g: 166, b: 120 },
} as const

const interpolateColor = (from: RgbColor, to: RgbColor, amount: number) => {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  }
}

const toRgba = (color: RgbColor, alpha: number) => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
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
  activityImages: ThemeActivityImages | undefined
) => {
  if (!activityImages) {
    return null
  }

  const normalizedMinutes = Math.floor(normalizeMinutes(minutes))
  if (normalizedMinutes >= 1261 || normalizedMinutes <= 450)
    return activityImages.bedtime
  if (normalizedMinutes <= 480) return activityImages.eatingBreakfast
  if (normalizedMinutes <= 495) return activityImages.washingTeeth
  if (normalizedMinutes <= 525) return activityImages.commute
  if (normalizedMinutes <= 885) return activityImages.schooltime
  if (normalizedMinutes <= 915) return activityImages.commute
  if (normalizedMinutes <= 1080) return activityImages.playing
  if (normalizedMinutes <= 1140) return activityImages.cooking
  if (normalizedMinutes <= 1170) return activityImages.eatingDinner
  if (normalizedMinutes <= 1215) return activityImages.computergames
  if (normalizedMinutes <= 1244) return activityImages.bathtime
  if (normalizedMinutes <= 1260) return activityImages.washingTeeth
  return activityImages.bedtime
}

export const getExplorerBackdropColor = (
  minutes: number,
  solarTimes: SolarTimes
) => {
  const normalizedMinutes = normalizeMinutes(minutes)
  const solarNoonMinutes =
    (solarTimes.daylightStartMinutes + solarTimes.daylightEndMinutes) / 2
  const nightMidpointMinutes = getNightMidpointMinutes(
    solarTimes.sunriseMinutes,
    solarTimes.sunsetMinutes
  )

  const colorStops = [
    {
      minute: nightMidpointMinutes - explorerUi.totalMinutes,
      color: EXPLORER_SKY_COLORS.night,
    },
    { minute: solarTimes.sunriseMinutes, color: EXPLORER_SKY_COLORS.sunrise },
    { minute: solarTimes.daylightStartMinutes, color: EXPLORER_SKY_COLORS.day },
    { minute: solarNoonMinutes, color: EXPLORER_SKY_COLORS.day },
    { minute: solarTimes.daylightEndMinutes, color: EXPLORER_SKY_COLORS.day },
    { minute: solarTimes.sunsetMinutes, color: EXPLORER_SKY_COLORS.sunset },
    {
      minute: nightMidpointMinutes + explorerUi.totalMinutes,
      color: EXPLORER_SKY_COLORS.night,
    },
  ]

  const adjustedMinutes =
    normalizedMinutes < solarTimes.sunriseMinutes
      ? normalizedMinutes + explorerUi.totalMinutes
      : normalizedMinutes

  for (let i = 0; i < colorStops.length - 1; i++) {
    const currentStop = colorStops[i]
    const nextStop = colorStops[i + 1]

    if (
      adjustedMinutes >= currentStop.minute &&
      adjustedMinutes <= nextStop.minute
    ) {
      const segmentDuration = nextStop.minute - currentStop.minute || 1
      const amount = (adjustedMinutes - currentStop.minute) / segmentDuration

      return toRgba(
        interpolateColor(currentStop.color, nextStop.color, amount),
        0.5
      )
    }
  }

  return toRgba(EXPLORER_SKY_COLORS.night, 0.5)
}

export const getExplorerBackgroundBlend = (
  minutes: number,
  solarTimes: SolarTimes
) => {
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
    base: 'night' as ExplorerBackgroundKey,
    overlay: 'night' as ExplorerBackgroundKey,
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
