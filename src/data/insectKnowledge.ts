import profiles from './insectProfiles.json'
import { ANIMAL_ASSET_BY_NAME } from './animalAssets'
import { getAnimalAbilityImage } from './animalAbilityAssets'
import { getGenericAnimalAbilityImage } from './genericAnimalAbilityAssets'
import { ANIMAL_HABITAT_IMAGE_BY_NAME } from './animalHabitatAssets'
import { ANIMAL_FOOD_IMAGE_BY_NAME } from './animalFoodAssets'
import type { ThemeId } from '../ui/themeOptions'

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
      ANIMAL_HABITAT_IMAGE_BY_NAME[
        profile.habitat as keyof typeof ANIMAL_HABITAT_IMAGE_BY_NAME
      ] ??
        (profile.habitat === 'fruit'
          ? ANIMAL_FOOD_IMAGE_BY_NAME.Fruit
          : asset('facts', profile.habitat)),
      `${profile.name} home`
    ),
    foodIllustration: required(
      ANIMAL_FOOD_IMAGE_BY_NAME[
        profile.foodImage as keyof typeof ANIMAL_FOOD_IMAGE_BY_NAME
      ] ??
        (profile.foodImage === 'aphids'
          ? asset('portraits', 'aphid')
          : asset('facts', profile.foodImage)),
      `${profile.name} food`
    ),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const getInsectBearAbilityImage = (theme: ThemeId, ability: string) =>
  required(
    asset('generic', ability) ?? getGenericAnimalAbilityImage(theme, ability),
    `${ability} princess bear`
  )

// This game collection includes the user-requested spiders as well as insects.
// Exclude both collection names and reused-art aliases from the Animals game.
export const INSECT_COLLECTION_NAMES = new Set(
  profiles.flatMap((profile) => [
    profile.name,
    ...(profile.existing ? [profile.existing] : []),
  ])
)
