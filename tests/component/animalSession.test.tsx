import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAnimalSession } from '../../src/components/animalTester/useAnimalSession'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('cancels a pending animal completion on reset and on unmount', () => {
  vi.useFakeTimers()
  const props = {
    theme: themes.princess,
    totalProblems: 1,
    starReward: 1,
    isRunning: true,
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
    onComplete: vi.fn(),
  }
  const { result, rerender, unmount } = renderHook(
    (current) => useAnimalSession(current),
    { initialProps: props }
  )
  act(() => result.current.setMode('solo'))
  act(() => result.current.playProps.onSoloChoice(result.current.animal!))
  rerender({ ...props, isRunning: false })
  act(() => vi.advanceTimersByTime(700))
  expect(props.onComplete).not.toHaveBeenCalled()
  rerender(props)
  act(() => result.current.playProps.onSoloChoice(result.current.animal!))
  unmount()
  act(() => vi.advanceTimersByTime(700))
  expect(props.onComplete).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('cancels solo feedback when changing mode or externally completing the session', () => {
  vi.useFakeTimers()
  const props = {
    theme: themes.princess,
    totalProblems: 1,
    starReward: 1,
    isRunning: true,
    isCompleted: false,
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
    onComplete: vi.fn(),
  }
  const { result, rerender } = renderHook(
    (current) => useAnimalSession(current),
    { initialProps: props }
  )
  act(() => result.current.setMode('solo'))
  act(() => result.current.playProps.onSoloChoice(result.current.animal!))
  act(() => result.current.setMode('learn'))
  act(() => vi.advanceTimersByTime(700))
  expect(props.onComplete).not.toHaveBeenCalled()
  act(() => result.current.setMode('solo'))
  expect(result.current.playProps.answeredCorrectly).toBe(false)
  act(() => result.current.playProps.onSoloChoice(result.current.animal!))
  rerender({ ...props, isCompleted: true })
  act(() => vi.advanceTimersByTime(700))
  expect(props.onComplete).not.toHaveBeenCalled()
})
