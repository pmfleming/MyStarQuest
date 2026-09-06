import { INSECT_KNOWLEDGE, getInsectBearAbilityImage } from '../insectKnowledge'
import type { CreatureCollectionData } from './types'

const collection: CreatureCollectionData = {
  catalog: INSECT_KNOWLEDGE.map((insect) => ({
    ...insect,
    kind: 'insect' as const,
  })),
  getTeachingFacts: (animal, themeId, useGenericAbilityImage = false) => {
    if (animal.kind !== 'insect')
      throw new Error('Unexpected creature collection')
    return [
      {
        label: 'HOME',
        text: animal.home,
        visual: '',
        word: animal.home,
        illustration: animal.homeImage,
      },
      {
        label: 'FOOD',
        text: animal.food,
        visual: '',
        word: animal.food,
        illustration: animal.foodIllustration,
      },
      {
        label: 'LOOKS',
        text: animal.looks,
        visual: '',
        word: animal.looks,
        illustration: animal.image,
        illustrationFit: animal.looksScale === 1 ? 'contain' : 'cover',
        detailPosition: animal.looksPosition,
        detailScale: animal.looksScale,
      },
      {
        label: 'SPECIAL',
        text: animal.abilityText,
        visual: '',
        word: animal.ability,
        isAbility: true,
        illustration: useGenericAbilityImage
          ? getInsectBearAbilityImage(themeId, animal.bear)
          : animal.abilityImage,
        illustrationFit: 'contain',
      },
    ]
  },
}

export default collection
