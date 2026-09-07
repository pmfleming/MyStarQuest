import type { ThemeId } from '../ui/themeOptions'
import { createAssetCatalog } from './assetCatalog'

const princessModules = import.meta.glob<string>(
  '../assets/animal-abilities-generic/princess/*.webp',
  {
    eager: true,
    import: 'default',
    query: '?url',
  }
)

const teenieModules = import.meta.glob<string>(
  '../assets/animal-abilities-generic/teenie/*.webp',
  { eager: true, import: 'default', query: '?url' }
)
const teenieCatalog = createAssetCatalog(teenieModules)

const princessCatalog = createAssetCatalog(princessModules)

export const PRINCESS_GENERIC_ANIMAL_ABILITY_ASSETS = princessCatalog.assets

const GENERIC_ANIMAL_ABILITY_ASSETS_BY_THEME: Partial<
  Record<ThemeId, Map<string, string>>
> = {
  princess: princessCatalog.byName,
  teenie: teenieCatalog.byName,
}

export const getAbilityAssetName = (abilityLabel: string) =>
  abilityLabel.trim().toLowerCase().replace(/\s+/g, '-')

export const getGenericAnimalAbilityImage = (
  themeId: ThemeId,
  abilityLabel: string
) => {
  const assetName = getAbilityAssetName(abilityLabel)
  const themedAssets = GENERIC_ANIMAL_ABILITY_ASSETS_BY_THEME[themeId]

  if (themeId === 'teenie') {
    const image = themedAssets?.get(assetName)
    if (!image) throw new Error(`Missing Teenie ability: ${assetName}`)
    return image
  }
  // Preserve the original fallback for themes without their own mascot set.
  return themedAssets?.get(assetName) ?? princessCatalog.byName.get(assetName)
}
