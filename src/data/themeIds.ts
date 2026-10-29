const themeIds = { princess: true, teenie: true }

export type ThemeId = keyof typeof themeIds

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && Object.hasOwn(themeIds, value)
