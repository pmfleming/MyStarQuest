import {
  TEENIEPING_KNOWLEDGE,
  TEENIEPING_CLUE_CATEGORIES,
} from '../teeniepingKnowledge'
import type { CreatureCollectionData } from './types'

const collection: CreatureCollectionData = {
  catalog: TEENIEPING_KNOWLEDGE,
  getTeachingFacts: (animal) => {
    if (animal.kind !== 'teenieping')
      throw new Error('Unexpected creature collection')
    return TEENIEPING_CLUE_CATEGORIES.map((category) => ({
      label: category.toUpperCase(),
      text: animal.clues[category],
      word: animal.clues[category],
      visual: '',
      illustration: animal.clueImages[category],
      illustrationFit: 'contain',
      wrapCaption: true,
    }))
  },
}

export default collection
