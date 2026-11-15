import { PUNIRUNE_KNOWLEDGE } from '../puniruneKnowledge'
import {
  getPuniruneClueImage,
  getHiddenPuniruneAppearanceImage,
} from '../puniruneClueAssets'
import type { CreatureCollectionData } from './types'
import pikarunClassroom from '../../assets/punirunes/hints/Pikarun-classroom.png'
import kapurunBakery from '../../assets/punirunes/hints/Kapurun-forest-bakery.png'
import gaorunPlayground from '../../assets/punirunes/hints/Gaorun-squishy-playground.png'
import jewerunQuest from '../../assets/punirunes/hints/Jewerun-crystal-quest.png'
import hikarunMoon from '../../assets/punirunes/hints/Hikarun-full-moon.png'
import otorunFestival from '../../assets/punirunes/hints/Otorun-music-festival.png'
import ururunPlans from '../../assets/punirunes/hints/Ururun-school-plans.png'
import enjerunArrow from '../../assets/punirunes/hints/Enjerun-lucky-arrow.png'

// Object-only illustrations are clues, never alternate answer portraits.
const specialArtwork: Partial<Record<string, string>> = {
  Pikarun: pikarunClassroom,
  Kapurun: kapurunBakery,
  Gaorun: gaorunPlayground,
  Jewerun: jewerunQuest,
  Hikarun: hikarunMoon,
  Otorun: otorunFestival,
  Ururun: ururunPlans,
  Enjerun: enjerunArrow,
}

const collection: CreatureCollectionData = {
  catalog: PUNIRUNE_KNOWLEDGE,
  getTeachingFacts: (animal, _theme, useGenericImage = false) => {
    if (animal.kind !== 'punirune')
      throw new Error('Unexpected creature collection')
    return animal.clues.map(({ label, text, visual }) => ({
      label,
      text,
      visual: '',
      word: text,
      wrapCaption: true,
      // The last easy clue reveals the portrait. Hard and hidden two-player
      // rounds keep a symbolic clue so the answer is not shown elsewhere.
      illustration:
        label === 'LOOKS'
          ? useGenericImage
            ? getHiddenPuniruneAppearanceImage()
            : animal.image
          : label === 'SPECIAL'
            ? (specialArtwork[animal.name] ?? getPuniruneClueImage(visual))
            : getPuniruneClueImage(visual),
      illustrationFit: 'contain',
    }))
  },
}

export default collection
