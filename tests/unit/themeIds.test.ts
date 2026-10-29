import { expect, it, vi } from 'vitest'
import { isThemeId } from '../../src/data/themeIds'
import { parseChildProfile } from '../../src/data/types'

// Profile parsing must remain usable without loading UI metadata and its images.
vi.mock('../../src/ui/themeOptions', () => {
  throw new Error('UI metadata loaded by a data parser')
})

it('parses supported themes without the UI asset module', () => {
  for (const themeId of ['princess', 'teenie']) {
    expect(isThemeId(themeId)).toBe(true)
    expect(parseChildProfile('child', { themeId })?.themeId).toBe(themeId)
  }
})

it('rejects inherited properties, coerced values and unsupported saved themes', () => {
  for (const value of [
    'constructor',
    '__proto__',
    'space',
    '',
    null,
    undefined,
    ['princess'],
    { toString: () => 'teenie' },
  ])
    expect(isThemeId(value)).toBe(false)
  expect(
    parseChildProfile('child', { themeId: 'space' })?.themeId
  ).toBeUndefined()
})
