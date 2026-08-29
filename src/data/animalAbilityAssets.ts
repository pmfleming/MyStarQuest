export type AnimalAbilityAsset = {
  name: string
  image: string
}

const ANIMAL_ABILITY_MODULES = import.meta.glob(
  '../assets/animal-abilities/*.webp',
  { eager: true, import: 'default' }
) as Record<string, string>

const getAssetName = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '') ?? path

export const ANIMAL_ABILITY_ASSETS: AnimalAbilityAsset[] = Object.entries(
  ANIMAL_ABILITY_MODULES
)
  .map(([path, image]) => ({
    name: getAssetName(path),
    image,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const ANIMAL_ABILITY_IMAGE_BY_NAME = new Map(
  ANIMAL_ABILITY_ASSETS.map((ability) => [ability.name, ability.image])
)

export const getAnimalAbilityImage = (animalName: string) =>
  ANIMAL_ABILITY_IMAGE_BY_NAME.get(animalName)
