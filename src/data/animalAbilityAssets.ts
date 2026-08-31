import { createAssetCatalog, type NamedAsset } from './assetCatalog'

export type AnimalAbilityAsset = NamedAsset

const ANIMAL_ABILITY_MODULES = import.meta.glob(
  '../assets/animal-abilities/*.webp',
  { eager: true, import: 'default' }
) as Record<string, string>

const abilityCatalog = createAssetCatalog(ANIMAL_ABILITY_MODULES)
export const ANIMAL_ABILITY_ASSETS: AnimalAbilityAsset[] = abilityCatalog.assets
export const ANIMAL_ABILITY_IMAGE_BY_NAME = abilityCatalog.byName

export const getAnimalAbilityImage = (animalName: string) =>
  ANIMAL_ABILITY_IMAGE_BY_NAME.get(animalName)
