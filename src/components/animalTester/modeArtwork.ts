import animalLearn from '../../assets/animal-mode-icons/learn.webp'
import animalSolo from '../../assets/animal-mode-icons/one-player.webp'
import animalTogether from '../../assets/animal-mode-icons/two-players.webp'
import insectLearn from '../../assets/creature-mode-icons/insects/learn.webp'
import insectSolo from '../../assets/creature-mode-icons/insects/one-player.webp'
import insectTogether from '../../assets/creature-mode-icons/insects/two-players.webp'
import teenieLearn from '../../assets/themes/teenie/schooltime.webp'
import teenieSolo from '../../assets/creature-mode-icons/teeniepings/one-player.webp'
import teenieTogether from '../../assets/creature-mode-icons/teeniepings/two-players.webp'
import type {
  CatalogAnimal,
  CreatureCollection,
} from '../../data/creatureCollections/types'
import dinosaurImage from '../../assets/dinosaurs/cartoon/tyrannosaurus.png'
import insectImage from '../../assets/animals/butterfly.webp'
import animalImage from '../../assets/animals/lion.webp'
import teenieImage from '../../assets/teenie/heart.webp'
import type { AnimalMode } from './useAnimalSession'

export const CREATURE_MODE_IMAGES: Record<
  CreatureCollection,
  Record<AnimalMode, string>
> = {
  animals: { learn: animalLearn, solo: animalSolo, together: animalTogether },
  dinosaurs: { learn: animalLearn, solo: animalSolo, together: animalTogether },
  insects: { learn: insectLearn, solo: insectSolo, together: insectTogether },
  teeniepings: {
    learn: teenieLearn,
    solo: teenieSolo,
    together: teenieTogether,
  },
}

type CollectionPresentation = {
  value: CreatureCollection
  label: string
  singular: string
  icon: string
  actionImage: string | null
}

export const CREATURE_COLLECTIONS: Record<
  CreatureCollection,
  CollectionPresentation
> = {
  animals: {
    value: 'animals',
    label: 'Animals',
    singular: 'Animal',
    icon: animalImage,
    actionImage: null,
  },
  insects: {
    value: 'insects',
    label: 'Insects',
    singular: 'Insect',
    icon: insectImage,
    actionImage: insectImage,
  },
  dinosaurs: {
    value: 'dinosaurs',
    label: 'Dinosaurs',
    singular: 'Dinosaur',
    icon: dinosaurImage,
    actionImage: dinosaurImage,
  },
  teeniepings: {
    value: 'teeniepings',
    label: 'Teeniepings',
    singular: 'Teenieping',
    icon: teenieImage,
    actionImage: teenieImage,
  },
}

export const formatAnimalName = (name: string) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
export const creatureLabel = (animal: CatalogAnimal) =>
  animal.kind === 'prehistoric' ? 'creature' : animal.kind
export const creatureDisplayName = (animal: CatalogAnimal) =>
  animal.kind === 'prehistoric'
    ? animal.displayName
    : formatAnimalName(animal.name)
