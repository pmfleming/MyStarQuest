import { createContext, type RefObject } from 'react'

export const ActivityTabVisibleContext = createContext(true)

// Other tabs can reset the retained Chores page, including its local timers.
export const ResetChoresContext = createContext<RefObject<
  (() => Promise<void>) | null
> | null>(null)
