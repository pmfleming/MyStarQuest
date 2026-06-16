import { useCallback, useState } from 'react'
import type { TaskType } from '../data/types'

export const useTaskActivityState = () => {
  const [activeMathId, setActiveMathId] = useState<string | null>(null)
  const [activeLargeNumbersId, setActiveLargeNumbersId] = useState<
    string | null
  >(null)
  const [activePVId, setActivePVId] = useState<string | null>(null)
  const [activeAlphabetId, setActiveAlphabetId] = useState<string | null>(null)
  const [activeSpellingId, setActiveSpellingId] = useState<string | null>(null)
  const [activeDinnerId, setActiveDinnerId] = useState<string | null>(null)
  const [activeWaterToiletId, setActiveWaterToiletId] = useState<string | null>(
    null
  )

  const clearActiveActivities = useCallback(() => {
    setActiveMathId(null)
    setActiveLargeNumbersId(null)
    setActivePVId(null)
    setActiveAlphabetId(null)
    setActiveSpellingId(null)
    setActiveDinnerId(null)
    setActiveWaterToiletId(null)
  }, [])

  const enterActivity = useCallback(
    (taskType: TaskType, id: string) => {
      clearActiveActivities()
      if (taskType === 'math') setActiveMathId(id)
      else if (taskType === 'large-numbers') setActiveLargeNumbersId(id)
      else if (taskType === 'positional-notation') setActivePVId(id)
      else if (taskType === 'alphabet') setActiveAlphabetId(id)
      else if (taskType === 'spelling') setActiveSpellingId(id)
      else if (taskType === 'eating') setActiveDinnerId(id)
      else if (taskType === 'watertoiletcheck') setActiveWaterToiletId(id)
    },
    [clearActiveActivities]
  )

  return {
    activeMathId,
    activeLargeNumbersId,
    activePVId,
    activeAlphabetId,
    activeSpellingId,
    activeDinnerId,
    activeWaterToiletId,
    setActiveDinnerId,
    clearActiveActivities,
    enterActivity,
  }
}
