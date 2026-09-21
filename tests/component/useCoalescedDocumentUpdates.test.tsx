import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useCoalescedDocumentUpdates } from '../../src/hooks/useCoalescedDocumentUpdates'

afterEach(() => vi.useRealTimers())

it('coalesces edits, preserves newer edits after a failed write and flushes on unmount', async () => {
  vi.useFakeTimers()
  let rejectWrite: (reason: Error) => void = () => {}
  const persist = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectWrite = reject
        })
    )
    .mockResolvedValue(undefined)
  const onError = vi.fn()
  const { result, unmount } = renderHook(() =>
    useCoalescedDocumentUpdates<{ title: string }>({ persist, onError })
  )
  act(() => {
    result.current.queueUpdate('a', { title: 'First' })
    result.current.queueUpdate('a', { title: 'Second' })
    result.current.queueUpdate('b', { title: 'Cancelled' })
    result.current.cancelUpdate('b')
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(140)
  })
  expect(persist).toHaveBeenCalledExactlyOnceWith('a', { title: 'Second' })
  act(() => result.current.queueUpdate('a', { title: 'Newest' }))
  await act(async () => {
    rejectWrite(new Error('Offline'))
  })
  expect(onError).toHaveBeenCalledOnce()
  expect(result.current.overrides).toEqual({ a: { title: 'Newest' } })
  unmount()
  expect(persist).toHaveBeenLastCalledWith('a', { title: 'Newest' })
  expect(persist).toHaveBeenCalledTimes(2)
  expect(vi.getTimerCount()).toBe(0)
})
