import { describe, expect, it } from 'vitest'
import {
  getActivityPrimaryActionLabel,
  shouldHidePresetPrimaryButton,
} from '../../src/ui/choreModeDefinitions'

describe('choreModeDefinitions', () => {
  it('keeps the Water/Toilet primary action visible while in-chore', () => {
    expect(shouldHidePresetPrimaryButton('watertoiletcheck', 'activity')).toBe(
      false
    )
  })

  it('uses a finish label for activity monitors once active', () => {
    expect(getActivityPrimaryActionLabel('setup')).toBe('Start')
    expect(getActivityPrimaryActionLabel('activity')).toBe('Finish')
  })
})
