import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildDefaultTests } from '../../src/data/taskDocuments'
import { useTaskActivityState } from '../../src/hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../../src/hooks/useTestCheckTriggers'
import { useActivityChallenge } from '../../src/hooks/useActivityChallenge'
import { createTestActivityBindings } from '../../src/ui/testActivityBindings'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('reset an active test', () => {
  it.each(buildDefaultTests('child'))(
    'stops $taskType immediately while the reset saves',
    async (test) => {
      let resolveWrite: () => void
      const resetTest = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveWrite = resolve
          })
      )
      const { result } = renderHook(() => {
        const activity = useTaskActivityState()
        const triggers = useTestCheckTriggers()
        return {
          activity,
          bindings: createTestActivityBindings({
            activity,
            triggers,
            resetTest,
            completeTest: vi.fn(),
            failTest: vi.fn(),
          }),
        }
      })
      act(() => result.current.bindings.onEnterChore(test))
      let pending: Promise<void>
      act(() => {
        pending = result.current.bindings.onReset(test)
      })
      expect(result.current.activity.activeIds).toEqual({})
      await act(async () => {
        resolveWrite()
        await pending
      })
    }
  )

  it('cancels a queued result when reset is pressed during answer feedback', async () => {
    vi.useFakeTimers()
    const test = buildDefaultTests('child')[0]
    const onComplete = vi.fn()
    const onStart = vi.fn()
    const onReset = vi.fn()
    let resolveWrite: () => void
    const resetTest = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve
      })
    const { result } = renderHook(() => {
      const activity = useTaskActivityState()
      const triggers = useTestCheckTriggers()
      const bindings = createTestActivityBindings({
        activity,
        triggers,
        resetTest,
        completeTest: onComplete,
        failTest: vi.fn(),
      })
      const challenge = useActivityChallenge({
        isRunning: activity.activeIds.math === test.id,
        totalProblems: 1,
        canStart: true,
        onStart,
        onReset,
        onComplete,
      })
      return { bindings, challenge }
    })
    act(() => result.current.bindings.onEnterChore(test))
    act(() => result.current.challenge.submitAnswer(true, vi.fn()))
    let pending: Promise<void>
    act(() => {
      pending = result.current.bindings.onReset(test)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600)
    })
    expect(onComplete).not.toHaveBeenCalled()
    expect(result.current.challenge.resultHistory).toEqual([])
    await act(async () => {
      resolveWrite()
      await pending
    })
  })
})
