import { useCallback, useState } from 'react'
import type { TaskType } from '../data/types'

export const useTaskActivityState = () => {
  const [activeIds, setActiveIds] = useState<
    Partial<Record<TaskType, string | null>>
  >({})

  const clearActiveActivities = useCallback(() => setActiveIds({}), [])
  const enterActivity = useCallback((type: TaskType, id: string) => {
    setActiveIds(type === 'standard' ? {} : { [type]: id })
  }, [])
  const setActiveDinnerId = useCallback((id: string | null) => {
    setActiveIds((previous) => ({ ...previous, eating: id }))
  }, [])

  return { activeIds, setActiveDinnerId, clearActiveActivities, enterActivity }
}
