import type { ThemeId } from './themeOptions'

const artwork = import.meta.glob<string>(
  '../assets/themes/*/weather/{environment.webp,wardrobe.png}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)

function asset(theme: ThemeId, path: string) {
  const source = artwork[`../assets/themes/${theme}/weather/${path}`]
  if (!source) throw new Error(`Missing weather artwork: ${theme}/${path}`)
  return source
}

export const getWeatherEnvironment = (theme: ThemeId) =>
  asset(theme, 'environment.webp')

export const getWeatherWardrobe = (theme: ThemeId) =>
  asset(theme, 'wardrobe.png')
