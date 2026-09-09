import animalLearn from '../../assets/animal-mode-icons/learn.webp'
import animalSolo from '../../assets/animal-mode-icons/one-player.webp'
import animalTogether from '../../assets/animal-mode-icons/two-players.webp'
import insectLearn from '../../assets/creature-mode-icons/insects/learn.webp'
import insectSolo from '../../assets/creature-mode-icons/insects/one-player.webp'
import insectTogether from '../../assets/creature-mode-icons/insects/two-players.webp'
import teenieLearn from '../../assets/themes/teenie/schooltime.webp'
import teenieSolo from '../../assets/creature-mode-icons/teeniepings/one-player.webp'
import teenieTogether from '../../assets/creature-mode-icons/teeniepings/two-players.webp'
import type { CreatureCollection } from '../../data/creatureCollections/types'
import type { AnimalMode } from './useAnimalSession'

export const CREATURE_MODE_IMAGES: Record<
  CreatureCollection,
  Record<AnimalMode, string>
> = {
  animals: { learn: animalLearn, solo: animalSolo, together: animalTogether },
  insects: { learn: insectLearn, solo: insectSolo, together: insectTogether },
  teeniepings: {
    learn: teenieLearn,
    solo: teenieSolo,
    together: teenieTogether,
  },
}
