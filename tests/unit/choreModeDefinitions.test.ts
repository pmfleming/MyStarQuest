import { describe, expect, it } from 'vitest'
import {
  getActivityPrimaryActionLabel,
  shouldHidePresetPrimaryButton,
} from '../../src/ui/choreModeDefinitions'

describe('choreModeDefinitions', () => {
  it('defines active monitor button visibility and labels', () => {
    expect(shouldHidePresetPrimaryButton('watertoiletcheck', 'activity')).toBe(
      false
    )
    expect(getActivityPrimaryActionLabel('setup')).toBe('Run')
    expect(getActivityPrimaryActionLabel('activity')).toBe('Finish')
  })
})
