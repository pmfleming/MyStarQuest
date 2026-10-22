import { afterEach, expect, it, vi } from 'vitest'
import { withDeadline } from '../../src/lib/withDeadline'

afterEach(() => vi.useRealTimers())

it('times out an uncooperative operation, aborts its signal and ignores late rejection', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  let fail!: (reason: Error) => void
  const pending = withDeadline(
    () =>
      new Promise<never>((_resolve, reject) => {
        fail = reject
      }),
    100,
    controller
  )
  const rejected = expect(pending).rejects.toThrow('Request timed out')
  await vi.advanceTimersByTimeAsync(100)
  await rejected
  expect(controller.signal.aborted).toBe(true)
  fail(new Error('Late transport failure'))
  await Promise.resolve()
  expect(vi.getTimerCount()).toBe(0)
})

it('cleans up success and synchronous errors and never starts an already cancelled operation', async () => {
  vi.useFakeTimers()
  await expect(withDeadline(async () => 42, 100)).resolves.toBe(42)
  await expect(
    withDeadline(() => {
      throw new Error('Start failed')
    }, 100)
  ).rejects.toThrow('Start failed')
  const controller = new AbortController()
  controller.abort(new Error('Stopped'))
  const run = vi.fn()
  await expect(withDeadline(run, 100, controller)).rejects.toThrow('Stopped')
  expect(run).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
