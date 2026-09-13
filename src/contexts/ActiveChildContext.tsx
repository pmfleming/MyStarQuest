import { createContext } from 'react'
import { useRequiredContext } from '../hooks/useRequiredContext'

export interface ActiveChildContextValue {
  activeChildId: string | null
  activeThemeId: string | null
  setActiveChild: (next: { id: string; themeId: string }) => void
  clearActiveChild: () => void
}

export const ActiveChildContext = createContext<
  ActiveChildContextValue | undefined
>(undefined)

export const useActiveChild = () => {
  return useRequiredContext(
    ActiveChildContext,
    'useActiveChild',
    'ActiveChildProvider'
  )
}
