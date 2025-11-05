import React, { createContext, useState, useMemo } from 'react'
import reactLogo from '../assets/react.svg'
/* eslint-disable react-refresh/only-export-components */

// Define the shape of a theme
export interface Theme {
  name: string
  palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
    base: string
  }
  motifs: string[]
  confetti: string[]
  emptyState: string
  backgroundImage?: string
  icons?: {
    dashboard?: string
    tasks?: string
    rewards?: string
    children?: string
  }
}

// Define the available themes
export const themes: Record<string, Theme> = {
  princess: {
    name: 'Princess Kingdom',
    palette: {
      primary: '#F6B0D1',
      secondary: '#C6B7F5',
      accent: '#FFD76A',
      neutral: '#B7F2D5',
      base: '#1C1B2E',
    },
    motifs: [
      'crowns',
      'tiaras',
      'castles',
      'wands',
      'carriages',
      'hearts',
      'stars',
      'ribbons',
    ],
    confetti: ['crowns', 'stars'],
    emptyState: 'castle skyline with banner placeholders',
    icons: {
      dashboard: reactLogo,
      tasks: reactLogo,
      rewards: reactLogo,
      children: reactLogo,
    },
  },
  robot: {
    name: 'Robot Factory',
    palette: {
      primary: '#9AA6B2',
      secondary: '#66E0E0',
      accent: '#FFC658',
      neutral: '#C6F36B',
      base: '#18202A',
    },
    motifs: [
      'gears',
      'bolts',
      'robot heads',
      'conveyor belts',
      'circuit traces',
    ],
    confetti: ['bolts', 'gears'],
    emptyState: 'assembly arm holding a blank panel',
  },
  space: {
    name: 'Space Adventure',
    palette: {
      primary: '#8B6CF6',
      secondary: '#FFD06E',
      accent: '#37D0C7',
      neutral: '#E7ECF2',
      base: '#0C0F1A',
    },
    motifs: ['rockets', 'planets', 'badges', 'telescopes'],
    confetti: ['stars', 'tiny rockets'],
    emptyState: 'moon rover with flag placeholder',
  },
  forest: {
    name: 'Forest Friends',
    palette: {
      primary: '#8CD67A',
      secondary: '#5C4732',
      accent: '#F58BAE',
      neutral: '#FFD685',
      base: '#BFE3FF',
    },
    motifs: ['fox', 'owl', 'bear cub', 'leaves', 'acorns'],
    confetti: ['leaves', 'acorns'],
    emptyState: 'tree stump with signpost',
  },
  ocean: {
    name: 'Ocean/Pirates',
    palette: {
      primary: '#0D3B66',
      secondary: '#3FA7D6',
      accent: '#FF7A90',
      neutral: '#F3D8A6',
      base: '#F6F8FB',
    },
    motifs: ['treasure chests', 'anchors', 'spyglasses', 'sails'],
    confetti: ['coins', 'anchors'],
    emptyState: 'little ship with blank sail emblem',
  },
  construction: {
    name: 'Construction/Vehicles',
    palette: {
      primary: '#FFD54F',
      secondary: '#2B2B2B',
      accent: '#FF8A65',
      neutral: '#BDE0FE',
      base: '#9EE493',
    },
    motifs: ['excavators', 'cones', 'hard hats', 'road signs'],
    confetti: ['triangles', 'bolts'],
    emptyState: 'barricade with placeholder board',
  },
}

// Define the shape of the theme context
export interface ThemeContextValue {
  theme: Theme
  currentTheme: string
  setTheme: (themeId: string) => void
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
  const [currentThemeId, setCurrentThemeId] = useState<string>('princess')

  const themeContextValue = useMemo(
    () => ({
      theme: themes[currentThemeId] || themes.princess,
      currentTheme: currentThemeId,
      setTheme: (themeId: string) => {
        if (themes[themeId]) {
          setCurrentThemeId(themeId)
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
