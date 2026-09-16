import type { ThemeId } from '../ui/themeOptions'
import { createAssetResolver } from './assetCatalog'
import { getGenericAnimalAbilityImage } from './genericAnimalAbilityAssets'

const images = import.meta.glob<string>(
  '../assets/dinosaurs/generic/**/*.png',
  {
    eager: true,
    import: 'default',
    query: '?url',
  }
)
const requiredImage = createAssetResolver(
  images,
  '../assets/dinosaurs/generic/',
  'Missing generic dinosaur ability image',
  '.png'
)

export function getGenericDinosaurAbilityImage(
  theme: ThemeId,
  ability: string
) {
  if (ability === 'dome' || ability === 'spikes')
    return requiredImage(`${theme}/${ability}`)
  const image = getGenericAnimalAbilityImage(theme, ability)
  if (!image) throw new Error(`Missing ${theme} dinosaur ability: ${ability}`)
  return image
}
