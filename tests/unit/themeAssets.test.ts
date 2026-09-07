import { describe, expect, it } from 'vitest'
import { getThemeAssets } from '../../src/ui/themeAssets'
import { themes } from '../../src/contexts/ThemeContext'
import { isThemeId } from '../../src/ui/themeOptions'
import {
  getChoreImage,
  getChoreImageOptions,
} from '../../src/assets/chores/assets'
import { getGenericAnimalAbilityImage } from '../../src/data/genericAnimalAbilityAssets'
import { getInsectBearAbilityImage } from '../../src/data/insectKnowledge'
import { getWaterImage, getToiletImage } from '../../src/ui/waterToiletAssets'
import { getTabIcon } from '../../src/lib/tabNavigation'
import abilityPrompts from '../../docs/assets/teenie-theme-ability-prompts.json'

describe('Teenie Friends theme', () => {
  it('registers a complete theme with its own visual roles', () => {
    expect(isThemeId('teenie')).toBe(true)
    expect(isThemeId('missing')).toBe(false)
    const princess = getThemeAssets('princess')
    const teenie = getThemeAssets('teenie')
    expect(Object.keys(teenie).sort()).toEqual(Object.keys(princess).sort())
    for (const [role, url] of Object.entries(teenie)) {
      expect(url, role).toBeTruthy()
      expect(url, role).not.toContain('/princess/')
      expect(url, role).not.toBe(princess[role as keyof typeof princess])
    }
    expect(getTabIcon('chores', 'teenie')).toBe(teenie.choresIcon)
    expect(getTabIcon('chores', 'princess')).toBe(princess.choresIcon)
  })

  it('preserves saved chore keys while changing images and labels', () => {
    expect(getChoreImage('bravePrincess', 'teenie')).toBe(
      getThemeAssets('teenie').brave
    )
    expect(
      getChoreImageOptions('teenie').find((o) => o.id === 'bravePrincess')
        ?.label
    ).toBe('Being brave')
    expect(getChoreImage('bravePrincess', 'princess')).toBe(
      getThemeAssets('princess').brave
    )
    expect(getChoreImage('unknown', 'teenie')).toBeUndefined()
    expect(getChoreImage('', 'teenie')).toBeUndefined()
  })

  it('supplies every activity and all sixteen seasonal backgrounds', () => {
    expect(Object.values(themes.teenie.activityImages!)).toHaveLength(10)
    const images = Object.values(
      themes.teenie.explorerBackgroundImages!
    ).flatMap(Object.values)
    expect(images).toHaveLength(16)
    expect(new Set(images).size).toBe(16)
    for (const image of images) expect(image).toContain('/teenie/')
  })

  it('keeps hydration levels and toilet states distinct and theme aware', () => {
    const images = ['full', 'twothirds', 'onethird', 'empty'].map((level) =>
      getWaterImage(
        themes.teenie,
        level as 'full' | 'twothirds' | 'onethird' | 'empty'
      )
    )
    expect(new Set(images).size).toBe(4)
    expect(images[3]).toBe(getThemeAssets('teenie').drinkSuccessImage)
    expect(getToiletImage(themes.teenie, 'didpeepee')).not.toBe(
      getToiletImage(themes.teenie, 'notpeepee')
    )
  })

  it('covers all 67 abilities and overrides the insect princess fallback', () => {
    expect(abilityPrompts).toHaveLength(67)
    for (const entry of abilityPrompts) {
      const ability = entry.id.replace('ability-', '')
      const url = getGenericAnimalAbilityImage('teenie', ability)
      expect(url, ability).toContain('/teenie/')
      expect(getInsectBearAbilityImage('teenie', ability)).toBe(url)
    }
    expect(getInsectBearAbilityImage('princess', 'hover')).toContain(
      '/insects/generic/'
    )
    expect(() =>
      getGenericAnimalAbilityImage('teenie', 'missing-ability')
    ).toThrow('Missing Teenie ability')
  })
})
