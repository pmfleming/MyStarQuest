import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import MealChoreFixture from '../fixtures/MealChoreFixture'
import { getMealImage } from '../../src/ui/choreOverviewAssets'
import { useMealPeriod } from '../../src/hooks/useMealPeriod'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it.each(['teenie', 'princess'] as const)(
  'updates the %s title, overview, button and plate across meal boundaries',
  async (themeId) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T09:59:59Z'))
    render(<MealChoreFixture themeId={themeId} />)
    expect(screen.getByRole('heading', { name: 'Breakfast' })).toBeVisible()
    expect(screen.getByAltText('Breakfast chore')).toHaveAttribute(
      'src',
      getMealImage(themeId, 'breakfast')
    )
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('heading', { name: 'Lunch' })).toBeVisible()
    expect(screen.getByAltText('Lunch chore')).toHaveAttribute(
      'src',
      getMealImage(themeId, 'lunch')
    )
    const start = screen.getByRole('button', { name: 'Run Lunch' })
    expect(start.querySelector('img')).toHaveAttribute(
      'src',
      getMealImage(themeId, 'lunch')
    )
    await act(async () => {
      fireEvent.click(start)
      await vi.dynamicImportSettled()
    })
    const plate = screen.getByLabelText('Dinner plate portions')
    expect(
      plate.querySelector(`image[href="${getMealImage(themeId, 'lunch')}"]`)
    ).not.toBeNull()
    vi.setSystemTime(new Date('2026-11-16T15:59:59Z'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(
      screen.getByRole('button', { name: 'Bite Dinner' }).querySelector('img')
    ).toHaveAttribute('src', getMealImage(themeId, 'dinner'))
    expect(
      plate.querySelector(`image[href="${getMealImage(themeId, 'dinner')}"]`)
    ).not.toBeNull()
  }
)

it('refreshes after returning to the app and when the child time zone changes', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-16T08:00:00Z'))
  const { result, rerender } = renderHook(
    ({ timeZone }) => useMealPeriod(timeZone),
    { initialProps: { timeZone: 'UTC' } }
  )
  expect(result.current).toBe('breakfast')
  vi.setSystemTime(new Date('2026-11-16T15:00:00Z'))
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(result.current).toBe('lunch')
  rerender({ timeZone: 'Europe/Amsterdam' })
  expect(result.current).toBe('dinner')
})
