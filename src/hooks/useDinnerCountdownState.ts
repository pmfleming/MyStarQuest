import { useEffect, useRef, useState } from 'react'
import { BITE_COOLDOWN_SECONDS } from '../data/types'
import { celebrateSuccess } from '../lib/celebrate'

type UseDinnerCountdownStateArgs = {
  remaining: number
  bitesLeft: number
  isTimerRunning: boolean
  isCompleted: boolean
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  timerStartedAt?: number | null
  onExpire?: () => void
}

export const useDinnerCountdownState = ({
  remaining,
  bitesLeft,
  isTimerRunning,
  isCompleted,
  biteCooldownSeconds,
  biteCooldownEndsAt,
  timerStartedAt,
  onExpire,
}: UseDinnerCountdownStateArgs) => {
  const [, setTick] = useState(0)
  const [animSlice, setAnimSlice] = useState<number | null>(null)
  const [biteVis, setBiteVis] = useState(false)
  const prevBites = useRef(bitesLeft)
  const now = Date.now()

  const liveRemainingFloat =
    isTimerRunning && timerStartedAt
      ? Math.max(0, remaining - (now - timerStartedAt) / 1000)
      : remaining
  const liveRemaining = Math.floor(liveRemainingFloat)
  const liveCooldown = biteCooldownEndsAt
    ? Math.max(0, (biteCooldownEndsAt - now) / 1000)
    : 0
  const totalCooldownSeconds = biteCooldownSeconds || BITE_COOLDOWN_SECONDS
  const isCoolingDown = liveCooldown > 0
  const isSuccess = isCompleted && bitesLeft <= 0 && !isCoolingDown
  const isTimeout = liveRemaining <= 0 && bitesLeft > 0
  const isFinished = isSuccess || isTimeout
  const isSetup = !isTimerRunning && !isFinished && !isCoolingDown
  const secRot = getSecondHandRotation(isTimerRunning, liveRemaining)

  useEffect(() => {
    const needsTick =
      isTimerRunning || (biteCooldownEndsAt && biteCooldownEndsAt > Date.now())
    if (!needsTick) return

    let interval: number | undefined
    const updateTimer = () => {
      if (interval !== undefined) window.clearInterval(interval)
      interval = undefined
      if (!document.hidden) {
        interval = window.setInterval(() => setTick((tick) => tick + 1), 250)
      }
    }

    updateTimer()
    document.addEventListener('visibilitychange', updateTimer)
    return () => {
      if (interval !== undefined) window.clearInterval(interval)
      document.removeEventListener('visibilitychange', updateTimer)
    }
  }, [isTimerRunning, biteCooldownEndsAt])

  useEffect(() => {
    if (isSuccess) celebrateSuccess()
  }, [isSuccess])

  useEffect(() => {
    if (isTimeout) onExpire?.()
  }, [isTimeout, onExpire])

  useEffect(() => {
    if (bitesLeft < prevBites.current) {
      setAnimSlice(bitesLeft)
      setBiteVis(false)
      const showBiteTimer = setTimeout(() => setBiteVis(true), 20)
      const clearBiteTimer = setTimeout(() => setAnimSlice(null), 800)
      prevBites.current = bitesLeft
      return () => {
        clearTimeout(showBiteTimer)
        clearTimeout(clearBiteTimer)
      }
    }
    prevBites.current = bitesLeft
  }, [bitesLeft])

  return {
    animSlice,
    biteVis,
    isSetup,
    isSuccess,
    isTimeout,
    isFinished,
    liveRemaining,
    liveRemainingFloat,
    liveCooldown,
    totalCooldownSeconds,
    secRot,
  }
}

const getSecondHandRotation = (
  isTimerRunning: boolean,
  liveRemaining: number
) => {
  if (!isTimerRunning || liveRemaining <= 0) return 0
  const seconds = liveRemaining % 60 || 60
  return ((Math.ceil(seconds / 2) * 2) / 60) * 180
}
