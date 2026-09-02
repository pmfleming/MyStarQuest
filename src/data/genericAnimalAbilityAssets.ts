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

const princessCatalog = createAssetCatalog(princessModules)

export const PRINCESS_GENERIC_ANIMAL_ABILITY_ASSETS = princessCatalog.assets

const GENERIC_ANIMAL_ABILITY_ASSETS_BY_THEME: Partial<
  Record<ThemeId, Map<string, string>>
> = {
  princess: princessCatalog.byName,
}

export const getAbilityAssetName = (abilityLabel: string) =>
  abilityLabel.trim().toLowerCase().replace(/\s+/g, '-')

export const getGenericAnimalAbilityImage = (
  themeId: ThemeId,
  abilityLabel: string
) => {
  const assetName = getAbilityAssetName(abilityLabel)
  const themedAssets = GENERIC_ANIMAL_ABILITY_ASSETS_BY_THEME[themeId]

  // Princess is the first complete themed mascot set. Other themes use the
  // same one-to-one ability art until their own mascot set is added.
  return themedAssets?.get(assetName) ?? princessCatalog.byName.get(assetName)
}
