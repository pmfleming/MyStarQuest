import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AsyncButton } from '../../src/components/ui/AsyncButton'
import { useActivityChallenge } from '../../src/hooks/useActivityChallenge'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('blocks duplicate submissions, shows rejection, and allows retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let reject!: (error: Error) => void
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail
        })
    )
    .mockResolvedValue(undefined)
  render(<AsyncButton onClick={save}>Save</AsyncButton>)
  const button = screen.getByRole('button', { name: 'Save' })
  fireEvent.click(button)
  fireEvent.click(button)
  expect(save).toHaveBeenCalledOnce()
  expect(button).toBeDisabled()
  await act(async () => reject(new Error('offline')))
  expect(screen.getByRole('alert')).toHaveTextContent('failed')
  fireEvent.click(button)
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  )
  expect(save).toHaveBeenCalledTimes(2)
  expect(button).toBeEnabled()
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
