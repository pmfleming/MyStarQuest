import { useCallback, useRef, useState } from 'react'

export const useAsyncAction = <ActionKey extends string>() => {
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const pendingRef = useRef<ActionKey | null>(null)

  const runAction = useCallback(
    async (
      actionName: string,
      actionKey: ActionKey,
      action: () => void | Promise<void>
    ) => {
      if (pendingRef.current) return false

      pendingRef.current = actionKey
      setPendingAction(actionKey)
      setActionError(null)
      try {
        await action()
        return true
      } catch (error) {
        console.error(`Failed to run ${actionName}`, error)
        setActionError(`${actionName} failed. Please try again.`)
        return false
      } finally {
        pendingRef.current = null
        setPendingAction(null)
      }
    },
    []
  )

  return { pendingAction, actionError, runAction }
}
