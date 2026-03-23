import { useEffect, useRef, useState } from 'react'
import { BITE_COOLDOWN_SECONDS } from '../data/types'

type UseDinnerActivityOptions<T> = {
  items: T[]
  getId: (item: T) => string
  isCompleted: (item: T) => boolean
  getRemaining: (item: T) => number
  getBitesLeft: (item: T) => number
  getTimerStartedAt: (item: T) => number | null | undefined
  getBaselineRemaining: (item: T) => number
  applyBite: (item: T) => Promise<boolean>
  expireTimer: (item: T) => void | Promise<void>
  isPersistedRunning?: (item: T) => boolean
  resetKeys?: ReadonlyArray<unknown>
}

export function useDinnerActivity<T>({
  items,
  getId,
  isCompleted,
  getRemaining,
  getBitesLeft,
  getTimerStartedAt,
  getBaselineRemaining,
  applyBite,
  expireTimer,
  isPersistedRunning,
  resetKeys = [],
}: UseDinnerActivityOptions<T>) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [biteCooldownEndsAt, setBiteCooldownEndsAt] = useState<number | null>(
    null
  )
  const [pendingBiteItemId, setPendingBiteItemId] = useState<string | null>(
    null
  )
  const resetKeySignature = JSON.stringify(resetKeys)

  const itemsRef = useRef(items)
  const isMountedRef = useRef(true)
  const isApplyingBiteRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setActiveItemId(null)
    setBiteCooldownEndsAt(null)
    setPendingBiteItemId(null)
  }, [resetKeySignature])

  /* --- Sync activeItemId with persisted state or completion --- */
  useEffect(() => {
    const runningItem = isPersistedRunning
      ? (items.find((item) => isPersistedRunning(item) && !isCompleted(item)) ??
        null)
      : null

    if (runningItem) {
      const runningId = getId(runningItem)
      if (activeItemId !== runningId) {
        setActiveItemId(runningId)
      }
      return
    }

    if (!activeItemId) return

    const activeItem = items.find((item) => getId(item) === activeItemId)
    if (!activeItem || isCompleted(activeItem)) {
      setActiveItemId(null)
    }
  }, [activeItemId, getId, isCompleted, isPersistedRunning, items])

  /* --- Unified Ticker (200ms) --- */
  useEffect(() => {
    const tick = async () => {
      const now = Date.now()

      // 1. Handle Cooldown Expiration
      if (biteCooldownEndsAt && now >= biteCooldownEndsAt) {
        setBiteCooldownEndsAt(null)
      }

      // 2. Handle Pending Bite Application
      // Only proceed if cooldown is over (or null) AND we aren't already applying one
      if (
        pendingBiteItemId &&
        (!biteCooldownEndsAt || now >= biteCooldownEndsAt) &&
        !isApplyingBiteRef.current
      ) {
        const item = itemsRef.current.find(
          (candidate) => getId(candidate) === pendingBiteItemId
        )

        if (!item || isCompleted(item)) {
          setPendingBiteItemId(null)
        } else {
          isApplyingBiteRef.current = true
          try {
            const done = await applyBite(item)
            if (done && isMountedRef.current) {
              setActiveItemId(null)
            }
          } catch (error) {
            console.error('Failed to apply dinner bite', error)
          } finally {
            if (isMountedRef.current) {
              isApplyingBiteRef.current = false
              setPendingBiteItemId(null)
            }
          }
        }
      }

      // 3. Handle Active Item Expiration/Completion
      if (activeItemId) {
        const item = itemsRef.current.find(
          (candidate) => getId(candidate) === activeItemId
        )

        if (!item || isCompleted(item)) {
          setActiveItemId(null)
        } else {
          const remaining = getRemaining(item)
          const bitesLeft = getBitesLeft(item)

          if (remaining <= 0) {
            void Promise.resolve(expireTimer(item))
            setActiveItemId(null)
          } else if (bitesLeft <= 0) {
            setActiveItemId(null)
          }
        }
      }
    }

    const interval = window.setInterval(tick, 200)
    return () => window.clearInterval(interval)
  }, [
    activeItemId,
    applyBite,
    biteCooldownEndsAt,
    expireTimer,
    getBitesLeft,
    getId,
    getRemaining,
    isCompleted,
    pendingBiteItemId,
  ])

  // Clear cooldown if both active and pending items are gone
  useEffect(() => {
    if (!activeItemId && !pendingBiteItemId) {
      setBiteCooldownEndsAt(null)
    }
  }, [activeItemId, pendingBiteItemId])

  const clearItemState = (itemId: string) => {
    if (activeItemId === itemId) {
      setActiveItemId(null)
    }
    if (pendingBiteItemId === itemId) {
      setPendingBiteItemId(null)
      setBiteCooldownEndsAt(null)
    }
  }

  const startActivity = (itemId: string) => {
    setActiveItemId(itemId)
  }

  const isRunning = (item: T) =>
    activeItemId === getId(item) || Boolean(isPersistedRunning?.(item))

  const isInActivity = (item: T) => isRunning(item) || isCompleted(item)

  const queueBite = (item: T) => {
    if (isCompleted(item)) return false
    if (
      (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt) ||
      pendingBiteItemId
    )
      return false
    if (getBitesLeft(item) <= 0) return false

    setPendingBiteItemId(getId(item))
    setBiteCooldownEndsAt(Date.now() + BITE_COOLDOWN_SECONDS * 1000)
    return true
  }

  const resetActivity = async (
    item: T,
    resetFn: (item: T) => Promise<void> | void
  ) => {
    clearItemState(getId(item))
    setBiteCooldownEndsAt(null)
    await resetFn(item)
  }

  // Derive absolute state for the active item to support local fractional ticking in component
  const activeItem = activeItemId
    ? items.find((item) => getId(item) === activeItemId)
    : null

  return {
    activeItemId,
    biteCooldownEndsAt,
    pendingBiteItemId,
    activeTimerStartedAt: activeItem ? getTimerStartedAt(activeItem) : null,
    activeBaselineRemaining: activeItem ? getBaselineRemaining(activeItem) : 0,
    activeBitesLeft: activeItem ? getBitesLeft(activeItem) : 0,
    startActivity,
    clearItemState,
    isRunning,
    isInActivity,
    queueBite,
    resetActivity,
  }
}
