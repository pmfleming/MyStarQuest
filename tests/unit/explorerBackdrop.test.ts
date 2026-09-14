import { expect, it } from 'vitest'
import {
  getExplorerBackdropColor,
  getExplorerBackgroundBlend,
} from '../../src/features/dayNightExplorer/dayNightExplorerBackdrop'
import { getSolarTimes } from '../../src/lib/solar'

const times = {
  ...getSolarTimes(new Date(2026, 8, 13)),
  sunriseMinutes: 360,
  daylightStartMinutes: 420,
  daylightEndMinutes: 1020,
  sunsetMinutes: 1080,
}

it.each([
  [360, 'rgba(255, 196, 143, 0.5)'],
  [390, 'rgba(195, 201, 197, 0.5)'],
  [420, 'rgba(135, 206, 250, 0.5)'],
  [720, 'rgba(135, 206, 250, 0.5)'],
  [1050, 'rgba(195, 186, 185, 0.5)'],
  [1080, 'rgba(255, 166, 120, 0.5)'],
  [0, 'rgba(56, 78, 140, 0.5)'],
])('keeps sky colors at minute %s and across wrapped days', (minute, color) => {
  for (const offset of [-1440, 0, 1440])
    expect(getExplorerBackdropColor(minute + offset, times)).toBe(color)
})

it('blends sunrise artwork halfway through dawn and preserves the daytime blend', () => {
  expect(getExplorerBackgroundBlend(390, times)).toEqual({
    base: 'sunrise',
    overlay: 'daytime',
    overlayOpacity: 0.5,
  })
  expect(getExplorerBackgroundBlend(720, times)).toEqual({
    base: 'daytime',
    overlay: 'daytime',
    overlayOpacity: 0.5,
  })
})
