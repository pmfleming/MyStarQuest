import type { ThemeId } from './themeOptions'
import type { WeatherCharacterPose } from '../lib/weather/weatherVisuals'

const artwork = import.meta.glob<string>(
  '../assets/themes/*/weather/**/*.webp',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)

function asset(theme: ThemeId, path: string) {
  const source = artwork[`../assets/themes/${theme}/weather/${path}.webp`]
  if (!source) throw new Error(`Missing weather artwork: ${theme}/${path}`)
  return source
}

export const getWeatherEnvironment = (theme: ThemeId) =>
  asset(theme, 'environment')
export const getWeatherWindPortrait = (theme: ThemeId) =>
  asset(theme, 'options/wind')
export const getWeatherCharacter = (
  theme: ThemeId,
  pose: WeatherCharacterPose
) => asset(theme, `characters/${pose}`)
