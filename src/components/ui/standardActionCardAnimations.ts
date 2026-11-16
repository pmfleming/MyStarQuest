import { useRef, useState } from 'react'

const EXIT_DURATION_MS = 400

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const waitForExit = (card: HTMLElement | null) => {
  if (!card || prefersReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      card.removeEventListener('animationend', handleAnimationEnd)
      window.clearTimeout(fallbackTimer)
      resolve()
    }
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === card) finish()
    }

    card.addEventListener('animationend', handleAnimationEnd)
    const fallbackTimer = window.setTimeout(finish, EXIT_DURATION_MS + 100)
  })
}

export const useCardExitAnimation = () => {
  const [isExiting, setIsExiting] = useState(false)
  const isExitingRef = useRef(false)
  const cardRef = useRef<HTMLElement>(null)

  const runWithExit = async (
    exits: boolean,
    action: () => Promise<boolean>
  ) => {
    if (isExitingRef.current) return false

    if (exits) {
      isExitingRef.current = true
      const exitFinished = waitForExit(cardRef.current)
      setIsExiting(true)
      await exitFinished
    }

    const succeeded = await action()
    if (!succeeded && exits) {
      isExitingRef.current = false
      setIsExiting(false)
    }
    return succeeded
  }

  return { cardRef, isExiting, runWithExit }
}
