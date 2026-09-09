import { describe, expect, it } from 'vitest'
import { getThemeAssets } from '../../src/ui/themeAssets'
import { themes } from '../../src/contexts/ThemeContext'
import { isThemeId } from '../../src/ui/themeOptions'
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
    expect(teenie.continueActivityImage).toContain('/teenie/OkeyDokey.webp')
    expect(teenie.confirmExitImage).toContain('/teenie/NoNo.webp')
    expect(princess.continueActivityImage).toBe(princess.quizCorrectImage)
    expect(princess.confirmExitImage).toBe(princess.quizIncorrectImage)
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

  it('provides artwork for configured abilities and rejects missing assets', () => {
    expect(abilityPrompts.length).toBeGreaterThan(0)
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
