import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useActivityChallenge } from '../../src/hooks/useActivityChallenge'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('retries a failed automatic outcome save without replaying the final puzzle', async () => {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(undefined)
  const { result, unmount } = renderHook(() =>
    useActivityChallenge({
      isRunning: true,
      totalProblems: 1,
      canStart: true,
      onStart: vi.fn(),
      onReset: vi.fn(),
      onComplete: save,
    })
  )
  act(() => result.current.submitAnswer(true, vi.fn()))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500)
  })
  expect(save).toHaveBeenCalledOnce()
  expect(result.current.persistence.actionError).toContain('failed')
  expect(result.current.resultHistory).toEqual(['correct'])
  await act(async () => result.current.persistence.retryAction())
  expect(save).toHaveBeenCalledTimes(2)
  expect(result.current.persistence.actionError).toBeNull()
  expect(result.current.resultHistory).toEqual(['correct'])
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
