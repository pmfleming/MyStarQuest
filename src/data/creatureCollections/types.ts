import type { AnimalFact, AnimalKnowledge } from '../animalKnowledgeTypes'
import type { InsectKnowledge } from '../insectKnowledge'
import type { TeeniepingKnowledge } from '../teeniepingKnowledge'
import type { DinosaurKnowledge } from '../dinosaurKnowledge'
import type { PuniruneKnowledge } from '../puniruneKnowledge'
import type { ThemeId } from '../themeIds'

export type CreatureCollection =
  'animals' | 'insects' | 'teeniepings' | 'dinosaurs' | 'punirunes'

export type CatalogAnimal =
  | (AnimalKnowledge & { kind: 'animal'; image: string })
  | (InsectKnowledge & { kind: 'insect' })
  | TeeniepingKnowledge
  | DinosaurKnowledge
  | PuniruneKnowledge

export type VisualFact = AnimalFact & {
  illustration?: string
  illustrationFit?: 'cover' | 'contain'
  word?: string
  isAbility?: boolean
  detailPosition?: string
  detailScale?: number
  wrapCaption?: boolean
}

export type CreatureCollectionData = {
  catalog: CatalogAnimal[]
  getTeachingFacts: (
    animal: CatalogAnimal,
    themeId: ThemeId,
    useGenericAbilityImage?: boolean
  ) => VisualFact[]
}
