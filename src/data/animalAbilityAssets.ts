import { createAssetCatalog } from './assetCatalog'

const ANIMAL_ABILITY_MODULES = import.meta.glob<string>(
  '../assets/animal-abilities/*.webp',
  { eager: true, import: 'default' }
)

const abilityCatalog = createAssetCatalog(ANIMAL_ABILITY_MODULES)
const ANIMAL_ABILITY_IMAGE_BY_NAME = abilityCatalog.byName

export const getAnimalAbilityImage = (animalName: string) =>
  ANIMAL_ABILITY_IMAGE_BY_NAME.get(animalName)
