import { useCallback, useState } from 'react'
import type { TaskType } from '../data/types'

export const useTaskActivityState = (scope = '') => {
  const [state, setState] = useState({ scope, activeIds: new Set<string>() })
  if (state.scope !== scope) {
    setState({ scope, activeIds: new Set<string>() })
  }

  const clearActiveActivities = useCallback(() => {
    setState((previous) => ({ ...previous, activeIds: new Set<string>() }))
  }, [])
  const enterActivity = useCallback((type: TaskType, id: string) => {
    if (type === 'standard') return
    setState((previous) => ({
      ...previous,
      activeIds: new Set(previous.activeIds).add(id),
    }))
  }, [])
  const exitActivity = useCallback((id: string) => {
    setState((previous) => {
      const activeIds = new Set(previous.activeIds)
      activeIds.delete(id)
      return { ...previous, activeIds }
    })
  }, [])

  return {
    activeIds: state.activeIds,
    exitActivity,
    clearActiveActivities,
    enterActivity,
  }
}
