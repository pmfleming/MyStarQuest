import { getTeenieActivities, getTeenieBackgrounds } from '../ui/themeAssets'
import React, { createContext, useEffect, useMemo, useState } from 'react'
import { isThemeId, type ThemeId } from '../ui/themeOptions'
import bedtimeImg from '../assets/themes/princess/bedtime.svg'
import eatingBreakfastImg from '../assets/themes/princess/eating-breakfast.svg'
import commuteImg from '../assets/themes/princess/commute.svg'
import schooltimeImg from '../assets/themes/princess/schooltime.svg'
import playingImg from '../assets/themes/princess/playing.svg'
import eatingDinnerImg from '../assets/themes/princess/eating-dinner.svg'
import computergamesImg from '../assets/themes/princess/computergames.svg'
import bathtimeImg from '../assets/themes/princess/bathtime.svg'
import cookingImg from '../assets/themes/princess/cooking.svg'
import washingTeethImg from '../assets/themes/princess/washing-teeth.svg'
import springSunriseImg from '../assets/themes/princess/seasons/spring-sunrise.webp'
import springDaytimeImg from '../assets/themes/princess/seasons/spring-daytime.webp'
import springSunsetImg from '../assets/themes/princess/seasons/spring-sunset.webp'
import springNightImg from '../assets/themes/princess/seasons/spring-night.webp'
import summerSunriseImg from '../assets/themes/princess/seasons/summer-sunrise.webp'
import summerDaytimeImg from '../assets/themes/princess/seasons/summer-daytime.webp'
import summerSunsetImg from '../assets/themes/princess/seasons/summer-sunset.webp'
import summerNightImg from '../assets/themes/princess/seasons/summer-night.webp'
import autumnSunriseImg from '../assets/themes/princess/seasons/autumn-sunrise.webp'
import autumnDaytimeImg from '../assets/themes/princess/seasons/autumn-daytime.webp'
import autumnSunsetImg from '../assets/themes/princess/seasons/autumn-sunset.webp'
import autumnNightImg from '../assets/themes/princess/seasons/autumn-night.webp'
import winterSunriseImg from '../assets/themes/princess/seasons/winter-sunrise.webp'
import winterDaytimeImg from '../assets/themes/princess/seasons/winter-daytime.webp'
import winterSunsetImg from '../assets/themes/princess/seasons/winter-sunset.webp'
import winterNightImg from '../assets/themes/princess/seasons/winter-night.webp'
import teenieFontUrl from '../assets/fonts/Nunito/Nunito-VariableFont_wght.woff2'
import princessFontUrl from '../assets/fonts/Merienda/Merienda-VariableFont_wght.woff2'
import type { Season } from '../lib/seasons'
/* eslint-disable react-refresh/only-export-components */

// Define the shape of a theme
interface ThemeColors {
  bg: string
  surface: string
  text: string
  primary: string
  secondary: string
  accent: string
}

export interface ThemeActivityImages {
  bedtime: string
  eatingBreakfast: string
  commute: string
  schooltime: string
  playing: string
  eatingDinner: string
  computergames: string
  bathtime: string
  cooking: string
  washingTeeth: string
}

export interface ThemeExplorerBackgroundImages {
  sunrise: string | Record<Season, string>
  daytime: string | Record<Season, string>
  sunset: string | Record<Season, string>
  night: string | Record<Season, string>
}

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  fontFamily: string
  fontHref: string
  colors: ThemeColors
  fonts: {
    heading: string
    body: string
  }
  buttonStyle: string
  bgPattern?: string
  confetti: string[]
  activityImages?: ThemeActivityImages
  explorerBackgroundImages?: ThemeExplorerBackgroundImages
}

// Define the available themes based on the prototype
export const themes: Record<ThemeId, Theme> = {
  teenie: {
    id: 'teenie',
    name: 'Teenie Friends',
    emoji: '💖',
    fontFamily: 'MSQ Nunito',
    fontHref: teenieFontUrl,
    colors: {
      bg: '#FFF0F6',
      surface: '#FFFFFF',
      text: '#3C2856',
      primary: '#B53E88',
      secondary: '#7751C9',
      accent: '#F2A3D1',
    },
    fonts: {
      heading: '"MSQ Nunito", var(--app-fallback-font), sans-serif',
      body: '"MSQ Nunito", var(--app-fallback-font), sans-serif',
    },
    buttonStyle:
      'rounded-3xl border-4 border-pink-400 shadow-[4px_4px_0px_#BA4B94]',
    bgPattern: 'none',
    confetti: ['⭐', '💖', '✨', '🌸'],
    get activityImages() {
      return getTeenieActivities()
    },
    get explorerBackgroundImages() {
      return getTeenieBackgrounds()
    },
  },
  princess: {
    id: 'princess',
    name: 'Royal Kingdom',
    emoji: '👑',
    fontFamily: 'MSQ Merienda',
    fontHref: princessFontUrl,
    colors: {
      bg: '#FDF2F8',
      surface: '#FFFFFF',
      text: '#831843',
      primary: '#EC4899',
      secondary: '#A855F7',
      accent: '#F9A8D4',
    },
    fonts: {
      heading: '"MSQ Merienda", var(--app-fallback-font), sans-serif',
      body: '"MSQ Merienda", var(--app-fallback-font), sans-serif',
    },
    buttonStyle:
      'rounded-3xl border-4 border-pink-500 shadow-[4px_4px_0px_#DB2777]',
    bgPattern: 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)',
    confetti: ['👑', '✨', '💖', '🌸'],
    activityImages: {
      bedtime: bedtimeImg,
      eatingBreakfast: eatingBreakfastImg,
      commute: commuteImg,
      schooltime: schooltimeImg,
      playing: playingImg,
      eatingDinner: eatingDinnerImg,
      computergames: computergamesImg,
      bathtime: bathtimeImg,
      cooking: cookingImg,
      washingTeeth: washingTeethImg,
    },
    explorerBackgroundImages: {
      sunrise: {
        spring: springSunriseImg,
        summer: summerSunriseImg,
        autumn: autumnSunriseImg,
        winter: winterSunriseImg,
      },
      daytime: {
        spring: springDaytimeImg,
        summer: summerDaytimeImg,
        autumn: autumnDaytimeImg,
        winter: winterDaytimeImg,
      },
      sunset: {
        spring: springSunsetImg,
        summer: summerSunsetImg,
        autumn: autumnSunsetImg,
        winter: winterSunsetImg,
      },
      night: {
        spring: springNightImg,
        summer: summerNightImg,
        autumn: autumnNightImg,
        winter: winterNightImg,
      },
    },
  },
}

// Define the shape of the theme context
interface ThemeContextValue {
  theme: Theme
  currentTheme: ThemeId
  setTheme: (themeId: ThemeId | string) => void
}

// Create the theme context
export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.princess,
  currentTheme: 'princess',
  setTheme: () => {},
})

// Create the theme provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

// Hook to use the theme context
export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
