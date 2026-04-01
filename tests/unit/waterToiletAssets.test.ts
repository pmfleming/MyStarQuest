import { describe, expect, it } from 'vitest'
import { getToiletImage, getWaterImage } from '../../src/ui/waterToiletAssets'

const princessTheme = {
  id: 'princess' as const,
  name: 'Princess',
  colors: {
    primary: '#000',
    secondary: '#111',
    accent: '#222',
    background: '#333',
    surface: '#444',
    text: '#555',
    success: '#666',
    warning: '#777',
    danger: '#888',
  },
  fonts: {
    heading: 'serif',
    body: 'sans-serif',
  },
}

const spaceTheme = {
  ...princessTheme,
  id: 'space' as const,
  name: 'Space',
}

describe('waterToiletAssets', () => {
  it('returns the shared princess in-chore images for water and toilet state', () => {
    expect(getWaterImage(princessTheme, 'full')).toContain('flask-full')
    expect(getWaterImage(princessTheme, 'twothirds')).toContain(
      'flask-twothirds'
    )
    expect(getWaterImage(princessTheme, 'onethird')).toContain('flask-onethird')
    expect(getWaterImage(princessTheme, 'empty')).toContain('drink-success')
    expect(getToiletImage(princessTheme, 'notpeepee')).toContain('notpeepee')
    expect(getToiletImage(princessTheme, 'didpeepee')).toContain('didpeepee')
  })

  it('returns no themed in-chore images outside princess theme', () => {
    expect(getWaterImage(spaceTheme, 'full')).toBeNull()
    expect(getToiletImage(spaceTheme, 'didpeepee')).toBeNull()
  })
})
