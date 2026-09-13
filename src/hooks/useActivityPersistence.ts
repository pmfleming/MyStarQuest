import { useCallback } from 'react'
import { useAsyncAction } from './useAsyncAction'

export const useActivityPersistence = ({
  onComplete,
  onFail,
}: {
  onComplete: () => void | Promise<void>
  onFail?: () => void | Promise<void>
}) => {
  const { runAction, ...feedback } = useAsyncAction<'outcome'>()
  const complete = useCallback(() => {
    void runAction('Save activity result', 'outcome', onComplete)
  }, [onComplete, runAction])
  const fail = useCallback(() => {
    void runAction('Save activity result', 'outcome', () => onFail?.())
  }, [onFail, runAction])
  return { complete, fail, feedback }
}
