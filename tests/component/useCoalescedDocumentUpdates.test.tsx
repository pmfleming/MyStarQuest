import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_UPDATE_COALESCE_MS,
  mergeOptimisticItems,
  useCoalescedDocumentUpdates,
} from '../../src/hooks/useCoalescedDocumentUpdates'

type TestPatch = Partial<{ value: number; enabled: boolean }>

describe('useCoalescedDocumentUpdates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates locally immediately and combines rapid changes into one write', async () => {
    vi.useFakeTimers()
    const persist = vi.fn(async () => undefined)
    const { result } = renderHook(() =>
      useCoalescedDocumentUpdates<TestPatch>({ persist })
    )

    act(() => {
      result.current.queueUpdate('item-1', { value: 2 })
      result.current.queueUpdate('item-1', { value: 3 })
      result.current.queueUpdate('item-1', { enabled: true })
    })

    expect(result.current.overrides['item-1']).toEqual({
      value: 3,
      enabled: true,
    })
    expect(persist).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFAULT_UPDATE_COALESCE_MS)
    })

    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledWith('item-1', {
      value: 3,
      enabled: true,
    })
  })

  it('keeps the optimistic value until the subscribed document catches up', () => {
    const persist = vi.fn(async () => undefined)
    const { result } = renderHook(() =>
      useCoalescedDocumentUpdates<TestPatch>({ persist })
    )

    act(() => result.current.queueUpdate('item-1', { value: 4 }))

    expect(
      mergeOptimisticItems(
        [{ id: 'item-1', value: 1 }],
        result.current.overrides
      )
    ).toEqual([{ id: 'item-1', value: 4 }])

    act(() => result.current.reconcile([{ id: 'item-1', value: 4 }]))
    expect(result.current.overrides).toEqual({})
  })
})
