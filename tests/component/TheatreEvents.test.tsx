import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import TheatreEvents from '../../src/components/TheatreEvents'
import { themes } from '../../src/contexts/ThemeContext'
import { getTheatreEvents, theatreProgramme } from '../../src/lib/theatreEvents'
import { getTheatreEventImage } from '../../src/ui/theatreEventAssets'
import type { SchoolCalendarData } from '../../src/lib/schoolCalendarData'

const state = vi.hoisted(() => ({
  selectedDateKey: '2026-09-27',
  events: {} as SchoolCalendarData,
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => state,
}))
vi.mock('../../src/hooks/useSchoolCalendar', () => ({
  useSchoolCalendar: () => ({ events: state.events, loadError: false }),
}))

beforeEach(() => {
  state.selectedDateKey = '2026-09-27'
  state.events = {}
  localStorage.clear()
})

it('includes all 21 dated performances without turning them into weekly or annual repeats', () => {
  const events = theatreProgramme.events
  expect(events).toHaveLength(21)
  expect(new Set(events.map(({ id }) => id)).size).toBe(21)
  expect(
    events.filter(({ start }) => start === '10:30').map(({ id }) => id)
  ).toEqual(['discodip', 'rock', 'kiekeboe'])
  expect(events.filter(({ start }) => start === '14:30')).toHaveLength(18)
  expect(getTheatreEvents('2026-09-28')).toEqual([])
  expect(getTheatreEvents('2027-09-27')).toEqual([])
  const nonSundayWeekdays: Record<string, number> = {
    '2026-10-03': 6,
    '2026-10-13': 2,
    '2026-10-14': 3,
    '2026-10-15': 4,
    '2026-10-17': 6,
    '2026-12-21': 1,
  }
  for (const event of events) {
    expect(getTheatreEventImage(event.id)).toMatch(/\.webp/)
    expect(new Date(`${event.date}T12:00:00Z`).getUTCDay()).toBe(
      nonSundayWeekdays[event.date] ?? 0
    )
  }
})

it.each(['princess', 'teenie'] as const)(
  'shows both opening-day performances, start times and the outdoor venue in %s',
  (themeId) => {
    render(<SchoolCalendar theme={themes[themeId]} />)
    const activities = within(
      screen.getByRole('region', { name: 'Theatre activities' })
    )
    expect(activities.getAllByRole('listitem')).toHaveLength(2)
    const disco = within(activities.getByText('Discodip 2+').closest('li')!)
    expect(disco.getByLabelText('At 10:30 AM')).toHaveAttribute(
      'datetime',
      '10:30'
    )
    expect(disco.getByText('Ages 2+ · €10')).toBeVisible()
    fireEvent.keyDown(disco.getByRole('button'), { key: 'Enter' })
    expect(disco.getByText(theatreProgramme.address)).toBeVisible()
    const concert = within(
      activities.getByText('Alle dagen feest').closest('li')!
    )
    expect(concert.getByLabelText('At 2:30 PM')).toHaveAttribute(
      'datetime',
      '14:30'
    )
    expect(concert.getByText('All ages · Free or €10 donation')).toBeVisible()
    fireEvent.keyDown(concert.getByRole('button'), { key: 'Enter' })
    expect(concert.getByText('Openluchttheater Elsrijk')).toBeVisible()
    expect(concert.queryByText(theatreProgramme.address)).toBeNull()
    expect(
      activities
        .getAllByRole('listitem')
        .every((item) => item.querySelectorAll('time').length === 1)
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Select 2026-09-27' })
    ).toHaveAttribute(
      'aria-description',
      'Day off · Discodip 2+ · Alle dagen feest'
    )
  }
)

it('keeps theatre activities across school-feed replacement without closing school', () => {
  state.selectedDateKey = '2026-10-13'
  state.events = {
    '2026-10-13': { isNonSchoolDay: false, summaries: ['Schoolfotograaf'] },
  }
  const { rerender } = render(<SchoolCalendar theme={themes.princess} />)
  expect(screen.getByText('School Photos')).toBeVisible()
  expect(screen.getByText('Meneer B en de grote Bubbelshow')).toBeVisible()
  expect(
    within(screen.getByRole('region', { name: 'Day agenda' })).getByText(
      'School'
    )
  ).toBeVisible()
  state.events = {}
  rerender(<SchoolCalendar theme={themes.princess} />)
  expect(screen.queryByText('School Photos')).toBeNull()
  expect(screen.getByText('Meneer B en de grote Bubbelshow')).toBeVisible()
})

it('preserves local afternoon times after the October daylight-saving change', () => {
  const { rerender } = render(
    <TheatreEvents dateKey="2026-10-25" theme={themes.princess} />
  )
  expect(screen.getByLabelText('At 2:30 PM')).toHaveAttribute(
    'datetime',
    '14:30'
  )
  rerender(<TheatreEvents dateKey="2026-12-06" theme={themes.princess} />)
  expect(screen.getByLabelText('At 10:30 AM')).toHaveAttribute(
    'datetime',
    '10:30'
  )
  rerender(<TheatreEvents dateKey="2026-12-07" theme={themes.princess} />)
  expect(
    screen.queryByRole('region', { name: 'Theatre activities' })
  ).toBeNull()
})
