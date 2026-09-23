import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  mergeOptimisticItems,
  reconcileOptimisticPatches,
  settleOptimisticPatch,
} from '../lib/optimisticState'

const DEFAULT_UPDATE_COALESCE_MS = 140

type Identifiable = { id: string }
type FieldPatch = object

type PendingUpdate<Patch extends FieldPatch> = {
  patch: Patch
  timer: ReturnType<typeof setTimeout>
}

type UseCoalescedDocumentUpdatesOptions<Patch extends FieldPatch> = {
  persist: (id: string, patch: Patch) => Promise<void>
  delayMs?: number
  onError?: (id: string, patch: Patch, error: unknown) => void
}

export const useOptimisticItems = <
  Item extends Identifiable,
  Patch extends FieldPatch,
>(
  items: Item[],
  overrides: Record<string, Patch>,
  reconcile: (items: Item[]) => void
) => {
  useEffect(() => reconcile(items), [items, reconcile])
  return useMemo(
    () => mergeOptimisticItems(items, overrides),
    [items, overrides]
  )
}

/**
 * Applies field edits locally in the same event turn, then combines rapid edits
 * to the same document into one remote write. Capacitor and the browser share
 * this path, so interaction behavior remains identical across platforms.
 */
export const useCoalescedDocumentUpdates = <Patch extends FieldPatch>({
  persist,
  delayMs = DEFAULT_UPDATE_COALESCE_MS,
  onError,
}: UseCoalescedDocumentUpdatesOptions<Patch>) => {
  const [overrides, setOverrides] = useState<Record<string, Patch>>({})
  const pendingRef = useRef(new Map<string, PendingUpdate<Patch>>())
  const persistRef = useRef(persist)
  const onErrorRef = useRef(onError)
  const mountedRef = useRef(true)

  useEffect(() => {
    persistRef.current = persist
    onErrorRef.current = onError
  }, [onError, persist])

  const settleOverride = useCallback((id: string, patch: Patch) => {
    if (!mountedRef.current) return
    setOverrides((previous) => settleOptimisticPatch(previous, id, patch))
  }, [])

  const flush = useCallback(
    async (id: string) => {
      const pending = pendingRef.current.get(id)
      if (!pending) return
      pendingRef.current.delete(id)

      try {
        await persistRef.current(id, pending.patch)
      } catch (error) {
        onErrorRef.current?.(id, pending.patch, error)
        settleOverride(id, pending.patch)
      }
    },
    [settleOverride]
  )

  const queueUpdate = useCallback(
    (id: string, patch: Patch) => {
      setOverrides((previous) => ({
        ...previous,
        [id]: { ...previous[id], ...patch },
      }))

      const existing = pendingRef.current.get(id)
      if (existing) clearTimeout(existing.timer)

      const combinedPatch: Patch = { ...existing?.patch, ...patch }
      const timer = setTimeout(() => void flush(id), delayMs)
      pendingRef.current.set(id, { patch: combinedPatch, timer })
    },
    [delayMs, flush]
  )

  const cancelUpdate = useCallback((id: string) => {
    const pending = pendingRef.current.get(id)
    if (pending) clearTimeout(pending.timer)
    pendingRef.current.delete(id)
    setOverrides((previous) => {
      if (!previous[id]) return previous
      const next = { ...previous }
      delete next[id]
      return next
    })
  }, [])

  const reconcile = useCallback((items: Identifiable[]) => {
    setOverrides((previous) => reconcileOptimisticPatches(previous, items))
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const pending = pendingRef.current

    return () => {
      mountedRef.current = false
      for (const [id, update] of pending) {
        clearTimeout(update.timer)
        void persistRef
          .current(id, update.patch)
          .catch((error) => onErrorRef.current?.(id, update.patch, error))
      }
      pending.clear()
    }
  }, [])

  return { overrides, queueUpdate, cancelUpdate, reconcile }
}
