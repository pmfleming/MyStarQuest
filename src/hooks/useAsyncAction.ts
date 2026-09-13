import { useCallback, useRef, useState } from 'react'

export const useAsyncAction = <ActionKey extends string>() => {
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const pendingRef = useRef<ActionKey | null>(null)
  const failedAction = useRef<{
    name: string
    key: ActionKey
    action: () => void | Promise<void>
  } | null>(null)

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
      failedAction.current = null
      try {
        const result = action()
        // Synchronous controls must remain usable within the same event turn.
        if (result) await result
        return true
      } catch (error) {
        console.error(`Failed to run ${actionName}`, error)
        setActionError(`${actionName} failed. Please try again.`)
        failedAction.current = { name: actionName, key: actionKey, action }
        return false
      } finally {
        pendingRef.current = null
        setPendingAction(null)
      }
    },
    []
  )

  const retryAction = useCallback(() => {
    const failed = failedAction.current
    if (failed) void runAction(failed.name, failed.key, failed.action)
  }, [runAction])

  return { pendingAction, actionError, runAction, retryAction }
}
