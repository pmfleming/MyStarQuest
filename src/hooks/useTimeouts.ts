import { useCallback, useEffect, useRef } from 'react'

// One owner for all delayed feedback belonging to an activity session.
export function useTimeouts() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])
  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      callback()
    }, delay)
    timers.current.add(timer)
  }, [])
  useEffect(() => cancel, [cancel])
  return { schedule, cancel }
}
