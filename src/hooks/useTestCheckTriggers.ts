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
  const [animalsCheckTriggers, setAnimalsCheckTriggers] = useTriggerMap()

  const clearCheckTriggers = useCallback(() => {
    setMathCheckTriggers({})
    setLargeNumbersCheckTriggers({})
    setPVCheckTriggers({})
    setAlphabetCheckTriggers({})
    setSpellingCheckTriggers({})
    setAnimalsCheckTriggers({})
  }, [
    setAlphabetCheckTriggers,
    setLargeNumbersCheckTriggers,
    setMathCheckTriggers,
    setPVCheckTriggers,
    setSpellingCheckTriggers,
    setAnimalsCheckTriggers,
  ])

  return {
    mathCheckTriggers,
    largeNumbersCheckTriggers,
    pvCheckTriggers,
    alphabetCheckTriggers,
    spellingCheckTriggers,
    animalsCheckTriggers,
    setMathCheckTriggers,
    setLargeNumbersCheckTriggers,
    setPVCheckTriggers,
    setAlphabetCheckTriggers,
    setSpellingCheckTriggers,
    setAnimalsCheckTriggers,
    clearCheckTriggers,
  }
}

export type TestCheckTriggers = ReturnType<typeof useTestCheckTriggers>
