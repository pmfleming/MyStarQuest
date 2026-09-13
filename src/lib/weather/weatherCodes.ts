export type WeatherLevel = 0 | 1 | 2 | 3
export type PrecipitationKind =
  'none' | 'rain' | 'snow' | 'sleet' | 'hail' | 'freezing-rain'

// Provider classification is shared by the description and independent layers.
const codes = {
  0: ['sunny', 'none', 0],
  1: ['sunny', 'none', 0],
  2: ['partly-cloudy', 'none', 0],
  3: ['overcast', 'none', 0],
  45: ['fog', 'none', 0],
  48: ['fog', 'none', 0],
  51: ['drizzle', 'rain', 1],
  53: ['drizzle', 'rain', 2],
  55: ['drizzle', 'rain', 3],
  56: ['freezing-rain', 'freezing-rain', 1],
  57: ['freezing-rain', 'freezing-rain', 3],
  61: ['rain', 'rain', 1],
  63: ['rain', 'rain', 2],
  65: ['heavy-rain', 'rain', 3],
  66: ['freezing-rain', 'freezing-rain', 1],
  67: ['freezing-rain', 'freezing-rain', 3],
  71: ['snow', 'snow', 1],
  73: ['snow', 'snow', 2],
  75: ['heavy-snow', 'snow', 3],
  77: ['snow', 'snow', 1],
  80: ['rain', 'rain', 1],
  81: ['rain', 'rain', 2],
  82: ['heavy-rain', 'rain', 3],
  85: ['snow', 'snow', 1],
  86: ['heavy-snow', 'snow', 3],
  95: ['thunderstorm', 'rain', 2],
  96: ['hail', 'hail', 2],
  99: ['hail', 'hail', 3],
} as const
type CodeProfile = (typeof codes)[keyof typeof codes]
const profiles: Readonly<Partial<Record<number, CodeProfile>>> = codes
const cloudLevels: readonly WeatherLevel[] = [0, 1, 2]

export function getWeatherCode(code: number | null) {
  const profile = code === null ? undefined : profiles[code]
  if (!profile || code === null) return undefined
  const [scene, precipitation, level] = profile
  return { scene, precipitation, level, cloudLevel: cloudLevels[code] ?? 3 }
}

export function getPrecipitationKind(
  kind: PrecipitationKind,
  rain: number,
  snow: number
): PrecipitationKind {
  if (kind === 'hail' || kind === 'freezing-rain') return kind
  if (rain > 0 && snow > 0) return 'sleet'
  if (snow > 0 || kind === 'snow') return 'snow'
  return rain > 0 ? 'rain' : kind
}

export function getPrecipitationLevel(
  kind: PrecipitationKind,
  codeLevel: WeatherLevel,
  rain: number,
  snow: number
): WeatherLevel {
  if (kind === 'none') return 0
  if (codeLevel === 3 || rain >= 7.5 || snow >= 1) return 3
  if (codeLevel === 2 || rain >= 2.5 || snow >= 0.3) return 2
  return 1
}
