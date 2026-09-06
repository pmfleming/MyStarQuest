import abilityImage from '../../assets/animal-facts/ability.webp'
import { getAnimalAbilityImage } from '../animalAbilityAssets'
import { ANIMAL_ASSET_BY_NAME } from '../animalAssets'
import { ANIMAL_FOOD_IMAGE_BY_NAME } from '../animalFoodAssets'
import { ANIMAL_HABITAT_IMAGE_BY_NAME } from '../animalHabitatAssets'
import { ANIMAL_LOCATIONS } from '../animalLocationAssets'
import { getGenericAnimalAbilityImage } from '../genericAnimalAbilityAssets'
import { ANIMAL_KNOWLEDGE } from '../animalKnowledge'
import { INSECT_COLLECTION_NAMES } from './insectCollectionNames'
import type { CreatureCollectionData } from './types'

const getLabelWord = (label: string) => {
  const words = label.toLowerCase().split(/\s+/)
  const word = words.at(-1) ?? label
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const collection: CreatureCollectionData = {
  catalog: ANIMAL_KNOWLEDGE.flatMap((animal) => {
    if (INSECT_COLLECTION_NAMES.has(animal.name)) return []
    const image = ANIMAL_ASSET_BY_NAME.get(animal.name)
    return image ? [{ ...animal, image, kind: 'animal' as const }] : []
  }),
  getTeachingFacts: (animal, themeId, useGenericAbilityImage = false) => {
    if (animal.kind !== 'animal')
      throw new Error('Unexpected creature collection')
    const locationFact = animal.habitat[0]
    const environmentFact = animal.habitat[1]
    const foodFact = animal.food[1]
    const abilityFact = animal.abilities[0]

    if (!locationFact || !environmentFact || !foodFact || !abilityFact) {
      throw new Error(`Animal knowledge is incomplete for ${animal.name}`)
    }

    return [
      {
        ...locationFact,
        label: 'LOCATION',
        illustration: ANIMAL_LOCATIONS[animal.locationCategory].image,
        word: ANIMAL_LOCATIONS[animal.locationCategory].label,
        illustrationFit: 'contain',
      },
      {
        ...environmentFact,
        label: 'ENVIRONMENT',
        illustration: ANIMAL_HABITAT_IMAGE_BY_NAME[animal.habitatCategory],
        illustrationFit: 'contain',
        word: animal.habitatCategory,
      },
      {
        ...foodFact,
        label: 'FOOD',
        illustration: ANIMAL_FOOD_IMAGE_BY_NAME[animal.foodCategory],
        illustrationFit: 'contain',
        word: animal.foodCategory,
      },
      {
        ...abilityFact,
        label: 'ABILITY',
        isAbility: true,
        illustration: useGenericAbilityImage
          ? (getGenericAnimalAbilityImage(themeId, abilityFact.label) ??
            abilityImage)
          : (getAnimalAbilityImage(animal.name) ?? abilityImage),
        illustrationFit: useGenericAbilityImage ? 'contain' : 'cover',
        word: getLabelWord(abilityFact.label),
      },
    ]
  },
}

export default collection
