import { useCallback, useState } from 'react'

type TriggerMap = Record<string, number>

const useTriggerMap = () => useState<TriggerMap>({})

export const useTestCheckTriggers = () => {
  const [mathCheckTriggers, setMathCheckTriggers] = useTriggerMap()
  const [largeNumbersCheckTriggers, setLargeNumbersCheckTriggers] =
    useTriggerMap()
  const [pvCheckTriggers, setPVCheckTriggers] = useTriggerMap()
  const [alphabetCheckTriggers, setAlphabetCheckTriggers] = useTriggerMap()
  const [spellingCheckTriggers, setSpellingCheckTriggers] = useTriggerMap()

  const clearCheckTriggers = useCallback(() => {
    setMathCheckTriggers({})
    setLargeNumbersCheckTriggers({})
    setPVCheckTriggers({})
    setAlphabetCheckTriggers({})
    setSpellingCheckTriggers({})
  }, [
    setAlphabetCheckTriggers,
    setLargeNumbersCheckTriggers,
    setMathCheckTriggers,
    setPVCheckTriggers,
    setSpellingCheckTriggers,
  ])

  return {
    mathCheckTriggers,
    largeNumbersCheckTriggers,
    pvCheckTriggers,
    alphabetCheckTriggers,
    spellingCheckTriggers,
    setMathCheckTriggers,
    setLargeNumbersCheckTriggers,
    setPVCheckTriggers,
    setAlphabetCheckTriggers,
    setSpellingCheckTriggers,
    clearCheckTriggers,
  }
}

export type TestCheckTriggers = ReturnType<typeof useTestCheckTriggers>
