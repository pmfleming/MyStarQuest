import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from './ThemeContext'
import {
  ActiveChildContext,
  type ActiveChildContextValue,
} from './ActiveChildContext'

const STORAGE_PREFIX = 'mystarquest:active-child'

const activeChildSchema = z.object({
  id: z.string().nullable().catch(null),
  themeId: z.string().nullable().catch(null),
})
type ActiveChildState = z.infer<typeof activeChildSchema>
const EMPTY_SELECTION: ActiveChildState = { id: null, themeId: null }

const isBrowser = typeof window !== 'undefined'

const readStoredState = (
  userId: string | undefined | null
): ActiveChildState => {
  if (!userId || !isBrowser) {
    return EMPTY_SELECTION
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${userId}`)
    const parsed = activeChildSchema.safeParse(JSON.parse(raw ?? '{}'))
    return parsed.success ? parsed.data : EMPTY_SELECTION
  } catch (error) {
    console.warn('Failed to parse stored active child', error)
  }

  return EMPTY_SELECTION
}

export const ActiveChildProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { user } = useAuth()

  return (
    <ActiveChildStateProvider
      key={user?.uid ?? 'signed-out'}
      userId={user?.uid}
    >
      {children}
    </ActiveChildStateProvider>
  )
}

const ActiveChildStateProvider = ({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string | undefined
}) => {
  const { setTheme } = useTheme()
  const [state, setState] = useState<ActiveChildState>(() =>
    readStoredState(userId)
  )

  useEffect(() => {
    if (state.themeId) {
      setTheme(state.themeId)
    }
  }, [state.themeId, setTheme])

  const persist = useCallback(
    (next: ActiveChildState) => {
      setState(next)
      if (!userId || !isBrowser) return
      try {
        if (next.id) {
          window.localStorage.setItem(
            `${STORAGE_PREFIX}:${userId}`,
            JSON.stringify(next)
          )
        } else {
          window.localStorage.removeItem(`${STORAGE_PREFIX}:${userId}`)
        }
      } catch (error) {
        console.warn('Unable to persist active child selection', error)
      }
    },
    [userId]
  )

  const setActiveChild = useCallback(
    (next: { id: string; themeId: string }) => {
      persist({ id: next.id, themeId: next.themeId })
    },
    [persist]
  )

  const clearActiveChild = useCallback(() => {
    persist(EMPTY_SELECTION)
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
