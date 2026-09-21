import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'

afterEach(() => vi.useRealTimers())
const advance = (milliseconds: number) =>
  act(() => vi.advanceTimersByTime(milliseconds))

it('shows the current balance after interruption, supports replay and caps artwork', () => {
  vi.useFakeTimers()
  const box = (count: number) => (
    <StrictMode>
      <StarInfoBox theme={themes.princess} totalStars={count} />
    </StrictMode>
  )
  const view = render(box(2))
  advance(70)
  view.rerender(box(0))
  advance(16)
  expect(screen.getByText('0')).toBeVisible()
  advance(5000)
  expect(screen.queryByText('2')).toBeNull()
  view.rerender(box(52))
  expect(view.container.querySelectorAll('img')).toHaveLength(51)
  advance(10_000)
  expect(screen.getByText('52')).toBeVisible()
  fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
  expect(screen.queryByText('52')).toBeNull()
  advance(10_000)
  expect(screen.getByText('52')).toBeVisible()
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
