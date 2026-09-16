import { describe, expect, it } from 'vitest'
import {
  INSECT_KNOWLEDGE,
  INSECT_COLLECTION_NAMES,
  getInsectBearAbilityImage,
} from '../../src/data/insectKnowledge'

describe('Insect collection', () => {
  it('has complete, individually illustrated creatures and matching bear abilities', async () => {
    const count = INSECT_KNOWLEDGE.length
    expect(count).toBeGreaterThan(0)
    expect(new Set(INSECT_KNOWLEDGE.map((item) => item.name)).size).toBe(count)
    expect(new Set(INSECT_KNOWLEDGE.map((item) => item.image)).size).toBe(count)
    expect(
      new Set(INSECT_KNOWLEDGE.map((item) => item.abilityImage)).size
    ).toBe(count)
    expect(INSECT_COLLECTION_NAMES.has('tarantula')).toBe(true)
    expect(INSECT_COLLECTION_NAMES).toEqual(
      new Set(
        INSECT_KNOWLEDGE.flatMap((insect) => [
          insect.name,
          ...(insect.existing ? [insect.existing] : []),
        ])
      )
    )
    for (const item of INSECT_KNOWLEDGE) {
      expect(item.homeImage).toBeTruthy()
      expect(item.foodIllustration).toBeTruthy()
      expect(item.looks).toBeTruthy()
      expect(item.species).toBeTruthy()
      expect(getInsectBearAbilityImage('princess', item.bear)).toBeTruthy()
      expect(getInsectBearAbilityImage('teenie', item.bear)).toBeTruthy()
    }
  })
})
