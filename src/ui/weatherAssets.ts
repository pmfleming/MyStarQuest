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

// Foot centres/baselines in the atlas's 400 × 500 coordinate system.
// The artwork is not centred on its grid: anchor the drawing, not the cell.
// Recalibrate these points when either wardrobe image is replaced.
export const weatherCharacterAnchors: Record<ThemeId, [number, number][]> = {
  princess: [
    [64.71, 99.5],
    [154.01, 99.5],
    [243.14, 99.5],
    [332.09, 99.5],
    [64.53, 199.71],
    [154.55, 199.71],
    [244.56, 199.71],
    [333.69, 200.07],
    [63.99, 298.15],
    [154.9, 298.15],
    [244.74, 298.15],
    [334.4, 298.5],
    [63.28, 395.51],
    [154.19, 395.51],
    [244.03, 395.51],
    [334.58, 395.86],
    [63.64, 496.79],
    [154.01, 496.79],
    [244.21, 496.79],
    [334.22, 496.43],
  ],
  teenie: [
    [53.3, 99.86],
    [142.6, 99.86],
    [240.11, 99.5],
    [338.86, 99.5],
    [53.48, 197.22],
    [144.74, 197.22],
    [242.42, 197.57],
    [341.89, 197.22],
    [52.94, 297.43],
    [146.35, 297.08],
    [243.85, 297.79],
    [341.89, 297.79],
    [52.05, 393.72],
    [146.52, 392.65],
    [244.74, 392.3],
    [343.32, 392.3],
    [53.65, 493.22],
    [147.95, 493.22],
    [245.1, 493.22],
    [342.78, 493.22],
  ],
}
