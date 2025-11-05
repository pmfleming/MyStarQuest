import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
/* eslint-disable react-refresh/only-export-components */
import { useAuth } from '../auth/AuthContext'
import { useTheme } from './ThemeContext'

const STORAGE_PREFIX = 'mystarquest:active-child'

export type ActiveChildState = {
  id: string | null
  themeId: string | null
}

export interface ActiveChildContextValue {
  activeChildId: string | null
  activeThemeId: string | null
  setActiveChild: (next: { id: string; themeId: string }) => void
  clearActiveChild: () => void
}

const ActiveChildContext = createContext<ActiveChildContextValue | undefined>(
  undefined
)

const isBrowser = typeof window !== 'undefined'

const readStoredState = (
  userId: string | undefined | null
): ActiveChildState => {
  if (!userId || !isBrowser) {
    return { id: null, themeId: null }
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${userId}`)
    if (!raw) return { id: null, themeId: null }
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const id = typeof parsed.id === 'string' ? parsed.id : null
      const themeId = typeof parsed.themeId === 'string' ? parsed.themeId : null
      return { id, themeId }
    }
  } catch (error) {
    console.warn('Failed to parse stored active child', error)
  }

  return { id: null, themeId: null }
}

export const ActiveChildProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const [state, setState] = useState<ActiveChildState>(() =>
    readStoredState(null)
  )

  useEffect(() => {
    setState(readStoredState(user?.uid))
  }, [user?.uid])

  useEffect(() => {
    if (state.themeId) {
      setTheme(state.themeId)
    }
  }, [state.themeId, setTheme])

  const persist = useCallback(
    (next: ActiveChildState) => {
      setState(next)
      if (!user?.uid || !isBrowser) return
      try {
        if (next.id) {
          window.localStorage.setItem(
            `${STORAGE_PREFIX}:${user.uid}`,
            JSON.stringify(next)
          )
        } else {
          window.localStorage.removeItem(`${STORAGE_PREFIX}:${user.uid}`)
        }
      } catch (error) {
        console.warn('Unable to persist active child selection', error)
      }
    },
    [user?.uid]
  )

  const setActiveChild = useCallback(
    (next: { id: string; themeId: string }) => {
      persist({ id: next.id, themeId: next.themeId })
    },
    [persist]
  )

  const clearActiveChild = useCallback(() => {
    persist({ id: null, themeId: null })
  }, [persist])

  const value = useMemo<ActiveChildContextValue>(
    () => ({
      activeChildId: state.id,
      activeThemeId: state.themeId,
      setActiveChild,
      clearActiveChild,
    }),
    [state.id, state.themeId, setActiveChild, clearActiveChild]
  )

  return (
    <ActiveChildContext.Provider value={value}>
      {children}
    </ActiveChildContext.Provider>
  )
}

export const useActiveChild = () => {
  const context = useContext(ActiveChildContext)
  if (!context) {
    throw new Error('useActiveChild must be used within an ActiveChildProvider')
  }
  return context
}
