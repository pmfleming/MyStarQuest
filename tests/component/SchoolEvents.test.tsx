import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SchoolEvents from '../../src/components/SchoolEvents'
import { themes } from '../../src/contexts/ThemeContext'

describe('school event timing', () => {
  it('keeps the dates on timed events spanning midnight', () => {
    render(
      <SchoolEvents
        theme={themes.teenie}
        day={{
          isNonSchoolDay: false,
          events: [
            {
              id: 'trip',
              summary: 'Schoolreis',
              allDay: false,
              start: '2026-09-23T20:30:00Z',
              end: '2026-09-24T06:00:00Z',
            },
          ],
        }}
      />
    )
    expect(screen.getByLabelText('From 23 Sept, 10:30 PM')).toBeVisible()
    expect(screen.getByLabelText('To 24 Sept, 8:00 AM')).toBeVisible()
  })

  it('uses one clock for a single instant', () => {
    render(
      <SchoolEvents
        theme={themes.princess}
        day={{
          isNonSchoolDay: false,
          events: [
            {
              id: 'reports',
              summary: 'Rapporten mee naar huis',
              allDay: false,
              start: '2026-09-23T12:00:00Z',
              end: '2026-09-23T12:00:00Z',
            },
          ],
        }}
      />
    )
    expect(screen.getByLabelText('At 2:00 PM')).toBeVisible()
    expect(
      screen.getByText('School Reports').closest('li')!.querySelectorAll('time')
    ).toHaveLength(1)
  })

  it('does not invent an all-day duration for legacy activities with missing times', () => {
    render(
      <SchoolEvents
        theme={themes.teenie}
        day={{
          isNonSchoolDay: false,
          summaries: ['Schoolfotograaf', 'Herfstvakantie'],
        }}
      />
    )
    const photos = within(screen.getByText('School Photos').closest('li')!)
    expect(photos.getByText('Time not provided')).toBeVisible()
    expect(photos.queryByText('All day')).not.toBeInTheDocument()
    expect(
      within(screen.getByText('Autumn Break').closest('li')!).getByText(
        'All day'
      )
    ).toBeVisible()
  })
})
