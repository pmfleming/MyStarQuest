import { createAssetCatalog } from './assetCatalog'
import { ADDITIONAL_ANIMAL_NAMES } from './additionalAnimalKnowledge'
import { ANIMAL_ASSET_BY_NAME } from './animalAssets'

const ANIMAL_ABILITY_MODULES = import.meta.glob<string>(
  '../assets/animal-abilities/*.webp',
  { eager: true, import: 'default' }
)

const abilityCatalog = createAssetCatalog(ANIMAL_ABILITY_MODULES)
const ANIMAL_ABILITY_IMAGE_BY_NAME = abilityCatalog.byName

export const getAnimalAbilityImage = (animalName: string) =>
  ANIMAL_ABILITY_IMAGE_BY_NAME.get(animalName) ??
  // New portraits depict the teaching action, so both cards share one asset.
  (ADDITIONAL_ANIMAL_NAMES.has(animalName)
    ? ANIMAL_ASSET_BY_NAME.get(animalName)
    : undefined)
