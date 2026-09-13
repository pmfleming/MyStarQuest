import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react'
import { isThemeId, type ThemeId } from '../ui/themeOptions'
import { ThemeContext, themes } from './ThemeContext'

// Create the theme provider
export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('princess')

  useEffect(() => {
    const activeTheme = themes[currentThemeId] || themes.princess

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.load(`1rem "${activeTheme.fontFamily}"`)
    }
  }, [currentThemeId])

  const themeContextValue = useMemo(
    () => ({
      theme: themes[currentThemeId] || themes.princess,
      currentTheme: currentThemeId,
      setTheme: (themeId: ThemeId | string) => {
        if (isThemeId(themeId)) {
          setCurrentThemeId(themeId)
        } else if (['space', 'nature', 'cartoon'].includes(themeId)) {
          setCurrentThemeId('princess')
        }
      },
    }),
    [currentThemeId]
  )

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
