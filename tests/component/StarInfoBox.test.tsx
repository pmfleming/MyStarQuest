import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it.each([' ', '{Enter}'])(
  'replays through the native button with %s',
  async (key) => {
    vi.useFakeTimers()
    render(<StarInfoBox theme={themes.princess} totalStars={0} />)
    expect(screen.getByText('0')).toHaveAttribute('aria-hidden', 'true')
    act(() => vi.advanceTimersByTime(5000))
    const button = screen.getByRole('button', { name: 'Replay star animation' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('data-phase', 'gathered')
    expect(screen.getByText('0')).toHaveAttribute('aria-hidden', 'false')
    vi.useRealTimers()
    const user = userEvent.setup()
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard(key)
    expect(button).not.toHaveAttribute('data-phase', 'gathered')
    expect(screen.getByText('0')).toHaveAttribute('aria-hidden', 'true')
  }
)

it('restarts an active animation without changing the total and follows updated stars', () => {
  vi.useFakeTimers()
  const { rerender, unmount } = render(
    <StarInfoBox theme={themes.teenie} totalStars={103} childName="Odette" />
  )
  const replay = screen.getByRole('button', { name: 'Replay star animation' })
  act(() => vi.advanceTimersByTime(2000))
  expect(replay).toHaveAttribute('data-phase', 'swarming')
  expect(screen.getByText('103')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText('Odette')).toHaveAttribute('aria-hidden', 'true')
  fireEvent.click(replay)
  expect(replay).toHaveAttribute('data-phase', 'hidden')
  expect(screen.getByText('103')).toHaveAttribute('aria-hidden', 'true')
  rerender(
    <StarInfoBox theme={themes.teenie} totalStars={104} childName="Odette" />
  )
  expect(screen.getByText('104')).toHaveAttribute('aria-hidden', 'true')
  act(() => vi.advanceTimersByTime(4300))
  expect(replay).toHaveAttribute('data-phase', 'gathering')
  expect(screen.getByText('104')).toHaveAttribute('aria-hidden', 'true')
  act(() => vi.advanceTimersByTime(2000))
  expect(replay).toHaveAttribute('data-phase', 'gathered')
  expect(screen.getByRole('status')).toHaveAttribute('aria-label', '104 stars')
  expect(screen.getByText('104')).toHaveAttribute('aria-hidden', 'false')
  expect(screen.getByRole('heading', { name: 'Odette' })).toBeInTheDocument()
  expect(screen.queryByText('stars', { exact: true })).not.toBeInTheDocument()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
