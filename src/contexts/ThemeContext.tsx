import React, { createContext, useState, useMemo } from 'react'
import type { ThemeId } from '../constants/themeOptions'
/* eslint-disable react-refresh/only-export-components */

// Define the shape of a theme
export interface ThemeColors {
  bg: string
  surface: string
  text: string
  primary: string
  secondary: string
  accent: string
}

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  colors: ThemeColors
  fonts: {
    heading: string
    body: string
  }
  buttonStyle: string
  bgPattern?: string
  confetti: string[]
}

// Define the available themes based on the prototype
export const themes: Record<ThemeId, Theme> = {
  space: {
    id: 'space',
    name: 'Galactic Explorer',
    emoji: '🚀',
    colors: {
      bg: '#0B1026',
      surface: '#1B2745',
      text: '#FFFFFF',
      primary: '#FFD700',
      secondary: '#00E5FF',
      accent: '#9C27B0',
    },
    fonts: {
      heading: '"Fredoka", "Verdana", sans-serif',
      body: '"Fredoka", "Verdana", sans-serif',
    },
    buttonStyle:
      'rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]',
    bgPattern: 'radial-gradient(circle at 50% 50%, #1B2745 0%, #0B1026 100%)',
    confetti: ['⭐', '🚀', '🌟', '✨'],
  },
  nature: {
    id: 'nature',
    name: 'Sunny Meadow',
    emoji: '🌿',
    colors: {
      bg: '#E8F5E9',
      surface: '#FFFFFF',
      text: '#33691E',
      primary: '#8BC34A',
      secondary: '#FF9800',
      accent: '#795548',
    },
    fonts: {
      heading: '"Fredoka", "Comic Sans MS", sans-serif',
      body: '"Fredoka", "Comic Sans MS", sans-serif',
    },
    buttonStyle:
      'rounded-2xl border-4 border-amber-800 shadow-[4px_4px_0px_#5D4037]',
    bgPattern: 'linear-gradient(180deg, #81D4FA 0%, #E8F5E9 30%, #C8E6C9 100%)',
    confetti: ['🌻', '🍃', '🌈', '🦋'],
  },
  cartoon: {
    id: 'cartoon',
    name: 'Super Squad',
    emoji: '💥',
    colors: {
      bg: '#FFF8E1',
      surface: '#FFFFFF',
      text: '#212121',
      primary: '#F44336',
      secondary: '#2196F3',
      accent: '#FFEB3B',
    },
    fonts: {
      heading: '"Fredoka", "Impact", sans-serif',
      body: '"Fredoka", "Arial", sans-serif',
    },
    buttonStyle:
      'rounded-xl border-4 border-black shadow-[6px_6px_0px_#000000]',
    bgPattern: 'radial-gradient(#ddd 1.5px, transparent 1.5px)',
    confetti: ['💥', '⚡', '🦸', '💪'],
  },
  princess: {
    id: 'princess',
    name: 'Royal Kingdom',
    emoji: '👑',
    colors: {
      bg: '#FDF2F8',
      surface: '#FFFFFF',
      text: '#831843',
      primary: '#EC4899',
      secondary: '#A855F7',
      accent: '#F9A8D4',
    },
    fonts: {
      heading: '"Fredoka", "Georgia", serif',
      body: '"Fredoka", "Georgia", serif',
    },
    buttonStyle:
      'rounded-3xl border-4 border-pink-500 shadow-[4px_4px_0px_#DB2777]',
    bgPattern: 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)',
    confetti: ['👑', '✨', '💖', '🌸'],
  },
}

// Define the shape of the theme context
export interface ThemeContextValue {
  theme: Theme
  currentTheme: ThemeId
  setTheme: (themeId: ThemeId | string) => void
}

// Create the theme context
export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.space,
  currentTheme: 'space',
  setTheme: () => {},
})

// Create the theme provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('space')

  const themeContextValue = useMemo(
    () => ({
      theme: themes[currentThemeId] || themes.space,
      currentTheme: currentThemeId,
      setTheme: (themeId: ThemeId | string) => {
        if (themes[themeId as ThemeId]) {
          setCurrentThemeId(themeId as ThemeId)
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
