import type { AnimalFoodName } from './animalFoodAssets'
import type { AnimalHabitatName } from './animalHabitatAssets'
import type { AnimalLocationName } from './animalLocationAssets'

export type AnimalFact = {
  label: string
  visual: string
  text: string
}

export type AnimalKnowledge = {
  name: string
  locationCategory: AnimalLocationName
  habitatCategory: AnimalHabitatName
  foodCategory: AnimalFoodName
  habitat: AnimalFact[]
  food: AnimalFact[]
  abilities: AnimalFact[]
}
