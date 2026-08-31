import { useState, useCallback, useEffect } from 'react'

const MAX_GENERATION_ATTEMPTS = 10

export const pickUnseenProblem = <Problem>(
  generate: () => Problem,
  isRejected: (problem: Problem) => boolean
) => {
  let problem = generate()
  let attempts = 0
  while (isRejected(problem) && attempts < MAX_GENERATION_ATTEMPTS) {
    problem = generate()
    attempts += 1
  }
  return problem
}

/**
 * Hook to track a history of seen problem keys to avoid repetitions
 * in random generators during a single activity session.
 */
export function useProblemHistory(resetKeys: unknown[] = []) {
  const [history, setHistory] = useState<Set<string>>(new Set())

  const isSeen = useCallback((key: string) => history.has(key), [history])

  const markSeen = useCallback((key: string) => {
    setHistory((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory(new Set())
  }, [])

  // Auto-clear when reset keys change (e.g. child switching)
  const resetKeySignature = JSON.stringify(resetKeys)
  useEffect(() => {
    clearHistory()
  }, [resetKeySignature, clearHistory])

  return {
    isSeen,
    markSeen,
    clearHistory,
  }
}
