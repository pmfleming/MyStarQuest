import { useCallback, useState } from 'react'
import type { TestType } from '../data/types'

export const useTestCheckTriggers = () => {
  const [checkTriggers, setCheckTriggers] = useState<
    Partial<Record<TestType, Record<string, number>>>
  >({})

  const onCheck = useCallback((type: TestType, id: string) => {
    setCheckTriggers((previous) => ({
      ...previous,
      [type]: { ...previous[type], [id]: (previous[type]?.[id] ?? 0) + 1 },
    }))
  }, [])
  const clearCheckTriggers = useCallback(() => setCheckTriggers({}), [])

  return { checkTriggers, onCheck, clearCheckTriggers }
}

export type TestCheckTriggers = ReturnType<typeof useTestCheckTriggers>
