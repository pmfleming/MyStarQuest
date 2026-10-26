import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import CalendarWeekdays from '../../src/components/CalendarWeekdays'
import CalendarActivityHistory from '../../src/components/CalendarActivityHistory'
import { SelectedDateContext } from '../../src/contexts/SelectedDateContext'
import { themes } from '../../src/contexts/ThemeContext'
import {
  buildCalendarHistory,
  type HistoryView,
  type HistoryPeriod,
} from '../../src/lib/calendarHistory'
import { buildDateKey, parseDateKey } from '../../src/lib/today'
import '../../src/index.css'

const entries = buildCalendarHistory(
  [
    {
      id: 'tidy',
      data: {
        taskTitle: 'Tidy my room',
        taskCollection: 'chores',
        dateKey: '2026-10-22',
        createdAt: new Date('2026-10-22T08:15:00Z'),
        delta: 2,
        imageKey: 'tidyingUp',
      },
    },
    {
      id: 'math',
      data: {
        taskTitle: 'Maths',
        taskCollection: 'tests',
        dateKey: '2026-10-22',
        createdAt: new Date('2026-10-22T10:30:00Z'),
        delta: 3,
      },
    },
    {
      id: 'piano',
      data: {
        taskTitle: 'Practice piano',
        taskCollection: 'chores',
        dateKey: '2026-10-20',
        createdAt: new Date('2026-10-20T14:30:00Z'),
        delta: 1,
        imageKey: 'practicePiano',
      },
    },
  ],
  [
    {
      id: 'gift',
      data: {
        rewardTitle: 'Pokémon cards',
        imageKey: 'pikachu',
        costStars: 5,
        createdAt: new Date('2026-10-22T16:00:00Z'),
      },
    },
    {
      id: 'toy',
      data: {
        rewardTitle: 'Birthday toy',
        imageKey: 'yoshiEgg',
        costStars: 10,
        createdAt: new Date('2026-01-01T12:00:00Z'),
      },
    },
  ],
  [],
  [],
  [],
  'Europe/London'
)
export default function Fixture() {
  const theme =
    new URLSearchParams(location.search).get('theme') === 'teenie'
      ? themes.teenie
      : themes.princess
  const [view, setView] = useState<HistoryView>('all')
  const [taskPeriod, setTaskPeriod] = useState<HistoryPeriod>('day')
  const [rewardPeriod, setRewardPeriod] = useState<HistoryPeriod>('day')
  const [selectedDateKey, setSelectedDateKey] = useState('2026-10-22')
  return (
    <SelectedDateContext.Provider
      value={{
        selectedDateKey,
        setSelectedDateKey,
        selectedDate: parseDateKey(selectedDateKey),
        nightlyResetKey: '2026-10-22',
        setSelectedDate: (date) => setSelectedDateKey(buildDateKey(date)),
        resetSelectedDate: () => setSelectedDateKey('2026-10-22'),
      }}
    >
      <main
        style={{
          maxWidth: 380,
          margin: '12px auto',
          padding: 12,
          background: theme.colors.surface,
          border: `3px solid ${theme.colors.accent}`,
          borderRadius: 24,
          fontFamily: theme.fonts.heading,
        }}
      >
        <CalendarActivityHistory
          theme={theme}
          entries={entries}
          view={view}
          onViewChange={setView}
          period={view === 'rewards' ? rewardPeriod : taskPeriod}
          onPeriodChange={view === 'rewards' ? setRewardPeriod : setTaskPeriod}
          childId="child"
          loading={false}
          error={false}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 3,
            }}
          >
            <CalendarWeekdays theme={theme} />
          </div>
        </CalendarActivityHistory>
      </main>
    </SelectedDateContext.Provider>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
