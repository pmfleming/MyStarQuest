import profiles from './insectProfiles.json'
import { ANIMAL_ASSET_BY_NAME } from './animalAssets'
import { getAnimalAbilityImage } from './animalAbilityAssets'
import { getGenericAnimalAbilityImage } from './genericAnimalAbilityAssets'
import { ANIMAL_HABITAT_IMAGE_BY_NAME } from './animalHabitatAssets'
import { ANIMAL_FOOD_IMAGE_BY_NAME } from './animalFoodAssets'
import type { ThemeId } from '../ui/themeOptions'

const habitatImages = new Map(Object.entries(ANIMAL_HABITAT_IMAGE_BY_NAME))
const foodImages = new Map(Object.entries(ANIMAL_FOOD_IMAGE_BY_NAME))

const images = import.meta.glob<string>('../assets/insects/**/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
})

const asset = (folder: string, name: string) =>
  images[`../assets/insects/${folder}/${name}.webp`]

export type InsectKnowledge = (typeof profiles)[number] & {
  image: string
  abilityImage: string
  homeImage: string
  foodIllustration: string
}

// A missing image is a content error, never silently omit an insect from play.
const required = (image: string | undefined, label: string): string => {
  if (!image) throw new Error(`Missing insect image: ${label}`)
  return image
}

export const INSECT_KNOWLEDGE: InsectKnowledge[] = profiles
  .map((profile) => ({
    ...profile,
    image: required(
      profile.existing
        ? ANIMAL_ASSET_BY_NAME.get(profile.existing)
        : asset('portraits', profile.name),
      `${profile.name} portrait`
    ),
    abilityImage: required(
      profile.existing
        ? getAnimalAbilityImage(profile.existing)
        : asset('abilities', profile.abilityAsset ?? profile.name),
      `${profile.name} ability`
    ),
    homeImage: required(
      habitatImages.get(profile.habitat) ??
        (profile.habitat === 'fruit'
          ? ANIMAL_FOOD_IMAGE_BY_NAME.Fruit
          : asset('facts', profile.habitat)),
      `${profile.name} home`
    ),
    foodIllustration: required(
      foodImages.get(profile.foodImage) ??
        (profile.foodImage === 'aphids'
          ? asset('portraits', 'aphid')
          : asset('facts', profile.foodImage)),
      `${profile.name} food`
    ),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const getInsectBearAbilityImage = (theme: ThemeId, ability: string) =>
  required(
    theme === 'teenie'
      ? getGenericAnimalAbilityImage(theme, ability)
      : (asset('generic', ability) ??
          getGenericAnimalAbilityImage(theme, ability)),
    `${ability} theme mascot`
  )
