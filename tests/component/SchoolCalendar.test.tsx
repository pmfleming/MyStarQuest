import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { themes } from '../../src/contexts/ThemeContext'
import {
  CALENDAR_SCHEDULE_STORAGE_KEY,
  DEFAULT_CALENDAR_SCHEDULE,
  saveCalendarSchedule,
} from '../../src/lib/calendarSchedule'
import {
  createSchoolCalendarStore,
  schoolCalendarStore,
} from '../../src/lib/schoolCalendarStore'
import { getSchoolEventImage } from '../../src/ui/schoolEventAssets'
import { getThemeAsset } from '../../src/ui/themeAssets'

const selection = vi.hoisted(() => ({
  selectedDateKey: '2026-09-09',
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => selection,
}))

beforeEach(() => {
  const store = createSchoolCalendarStore()
  vi.spyOn(schoolCalendarStore, 'getSnapshot').mockImplementation(
    store.getSnapshot
  )
  vi.spyOn(schoolCalendarStore, 'subscribe').mockImplementation(store.subscribe)
  vi.spyOn(schoolCalendarStore, 'start').mockImplementation(store.start)
  vi.spyOn(schoolCalendarStore, 'refresh').mockImplementation(store.refresh)
  selection.selectedDateKey = '2026-09-09'
  selection.setSelectedDateKey.mockClear()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it.each([['2026-01-31', 31, '2026-02-28']])(
  'selects %s and clamps month navigation',
  async (dateKey, days, next) => {
    selection.selectedDateKey = dateKey
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )
    render(<SchoolCalendar theme={themes.princess} />)
    const dateButtons = screen.getAllByRole('button', { name: /^Select / })
    const selected = screen.getByLabelText(`Select ${dateKey}`)
    expect(dateButtons).toHaveLength(days)
    expect(dateButtons).toContain(selected)
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(selected)
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(dateKey)
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(next)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  }
)

it.each(['teenie'] as const)(
  'shows short English school activities with %s artwork without removing school',
  async (themeId) => {
    selection.selectedDateKey = '2026-09-23'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          '2026-09-23': {
            isNonSchoolDay: true,
            hasAllDayEvent: true,
            summaries: ['Schoolfotograaf', 'Schoolfotograaf broertjes/zusjes'],
            events: [
              {
                id: 'photo',
                summary: 'Schoolfotograaf',
                allDay: true,
                start: '2026-09-22T00:00:00Z',
                end: '2026-09-24T00:00:00Z',
              },
              {
                id: 'siblings',
                summary: 'Schoolfotograaf broertjes/zusjes',
                allDay: false,
                start: '2026-09-23T10:30:00Z',
                end: '2026-09-23T14:00:00Z',
              },
            ],
          },
        }),
      })
    )
    render(<SchoolCalendar theme={themes[themeId]} />)
    const details = within(
      screen.getByRole('region', { name: 'School events' })
    )
    await waitFor(() =>
      expect(details.getByText('School Photos')).toBeInTheDocument()
    )
    expect(details.queryByText('Schoolfotograaf')).not.toBeInTheDocument()
    const siblings = within(details.getByText('Sibling Photos').closest('li')!)
    expect(siblings.getByLabelText('From 12:30 PM')).toBeVisible()
    expect(siblings.getByLabelText('To 4:00 PM')).toBeVisible()
    const allDay = details.getByText('School Photos').closest('li')!
    expect(within(allDay).getByText('All day')).toBeVisible()
    expect(allDay.querySelector('time')).toBeNull()
    expect(
      details.getByText('Sibling Photos').closest('li')!.querySelector('img')
    ).toHaveAttribute('src', getSchoolEventImage(themeId, 'sibling-photo'))
    expect(
      within(screen.getByRole('region', { name: 'Day agenda' })).getByText(
        'Table work'
      )
    ).toBeInTheDocument()
    const cell = screen.getByRole('button', { name: 'Select 2026-09-23' })
    expect(within(cell).getByRole('img')).toHaveAttribute(
      'src',
      getSchoolEventImage(themeId, 'school-photo')
    )
    expect(cell).not.toHaveTextContent('+1')
    expect(cell.querySelector('img[alt=""]')).toHaveAttribute(
      'src',
      getThemeAsset(themeId, 'calendarMoreIcon')
    )
    expect(cell).toHaveAttribute(
      'aria-description',
      expect.stringContaining('School day')
    )
    const row = screen.getByText('Table work').closest('[role="button"]')!
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(row).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(row, { key: ' ' })
    fireEvent.focusIn(cell)
    expect(row).toHaveAttribute('aria-expanded', 'false')
    const invalid = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    Object.assign(invalid.events[0], { start: '23:00', end: '07:00' })
    expect(() => saveCalendarSchedule(invalid)).toThrow()
    expect(localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)).toBeNull()
    const edited = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    edited.events.find(({ id }) => id === 'judo')!.start = '14:30'
    act(() => saveCalendarSchedule(edited))
    const judo = within(screen.getByText('Judo').closest('li')!)
    expect(judo.getByLabelText('From 2:30 PM')).toBeVisible()
    expect(judo.getByLabelText('To 3:00 PM')).toBeVisible()
    act(() => {
      localStorage.setItem(
        CALENDAR_SCHEDULE_STORAGE_KEY,
        JSON.stringify({ version: 1, events: [] })
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: CALENDAR_SCHEDULE_STORAGE_KEY })
      )
    })
    expect(screen.queryByText('Judo')).not.toBeInTheDocument()
  }
)
