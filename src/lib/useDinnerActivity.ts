import { useEffect, useRef, useState } from 'react'
import { BITE_COOLDOWN_SECONDS } from '../data/types'

type UseDinnerActivityOptions<T> = {
  items: T[]
  getId: (item: T) => string
  isCompleted: (item: T) => boolean
  getRemaining: (item: T) => number
  getBitesLeft: (item: T) => number
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

  useEffect(() => {
    if (!biteCooldownEndsAt) return

    const checkCooldown = () => {
      if (Date.now() >= biteCooldownEndsAt) {
        setBiteCooldownEndsAt(null)
      }
    }

    const timer = window.setInterval(checkCooldown, 200)
    return () => window.clearInterval(timer)
  }, [biteCooldownEndsAt])

  useEffect(() => {
    if (!activeItemId && !pendingBiteItemId) {
      setBiteCooldownEndsAt(null)
    }
  }, [activeItemId, pendingBiteItemId])

  useEffect(() => {
    if (
      !pendingBiteItemId ||
      (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt)
    )
      return

    const applyQueuedBite = async () => {
      const item = itemsRef.current.find(
        (candidate) => getId(candidate) === pendingBiteItemId
      )

      if (isMountedRef.current) {
        setPendingBiteItemId(null)
      }

      if (!item || isCompleted(item)) return

      try {
        const done = await applyBite(item)
        if (done && isMountedRef.current) {
          setActiveItemId(null)
        }
      } catch (error) {
        console.error('Failed to apply dinner bite', error)
      }
    }

    void applyQueuedBite()
  }, [applyBite, biteCooldownEndsAt, getId, isCompleted, pendingBiteItemId])

  useEffect(() => {
    if (!activeItemId) return

    const timer = window.setInterval(() => {
      const item = itemsRef.current.find(
        (candidate) => getId(candidate) === activeItemId
      )

      if (!item || isCompleted(item)) {
        setActiveItemId(null)
        return
      }

      const remaining = getRemaining(item)
      const bitesLeft = getBitesLeft(item)

      if (remaining <= 0) {
        void Promise.resolve(expireTimer(item))
        setActiveItemId(null)
        return
      }

      if (bitesLeft <= 0) {
        setActiveItemId(null)
        return
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [
    activeItemId,
    expireTimer,
    getBitesLeft,
    getId,
    getRemaining,
    isCompleted,
  ])

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

  return {
    activeItemId,
    biteCooldownEndsAt,
    pendingBiteItemId,
    startActivity,
    clearItemState,
    isRunning,
    isInActivity,
    queueBite,
    resetActivity,
  }
}
