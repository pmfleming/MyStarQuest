import { DINOSAUR_KNOWLEDGE } from '../dinosaurKnowledge'
import { getGenericDinosaurAbilityImage } from '../dinosaurAbilityAssets'
import type { CreatureCollectionData } from './types'

const collection: CreatureCollectionData = {
  catalog: DINOSAUR_KNOWLEDGE,
  getTeachingFacts: (animal, theme, useGenericAbilityImage = false) => {
    if (animal.kind !== 'prehistoric')
      throw new Error('Unexpected creature collection')
    return [
      {
        label: 'FOOD',
        visual: '',
        text: animal.food,
        word: animal.foodWord,
        illustration: animal.foodImage,
        illustrationFit: 'contain',
      },
      {
        label: 'HABITAT',
        visual: '',
        text: animal.habitatText,
        word: animal.habitatWord,
        illustration: animal.habitatImage,
        illustrationFit: 'contain',
      },
      {
        label: 'ABILITY',
        visual: '',
        text: animal.abilityText,
        word: animal.ability,
        isAbility: true,
        illustration: useGenericAbilityImage
          ? getGenericDinosaurAbilityImage(theme, animal.genericAbility)
          : animal.abilityImage,
        illustrationFit: 'contain',
      },
      {
        label: 'GEOLOGICAL PERIOD',
        visual: '',
        text: `I lived in the ${animal.period}, millions of years ago.`,
        word: animal.period,
        illustration: animal.periodImage,
        illustrationFit: 'contain',
        wrapCaption: true,
      },
    ]
  },
}

export default collection
