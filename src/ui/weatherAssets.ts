import type { ThemeId } from './themeOptions'
import { createAssetResolver } from '../data/assetCatalog'

const artwork = import.meta.glob<string>(
  '../assets/themes/*/weather/{environment.webp,wardrobe.png}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)

const asset = createAssetResolver(
  artwork,
  '../assets/themes/',
  'Missing weather artwork'
)

export const getWeatherEnvironment = (theme: ThemeId) =>
  asset(`${theme}/weather/environment.webp`)

export const getWeatherWardrobe = (theme: ThemeId) =>
  asset(`${theme}/weather/wardrobe.png`)
