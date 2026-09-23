import type { Theme } from '../contexts/ThemeContext'
import type { AgendaItem } from '../lib/calendarSchedule'
import AgendaList from './AgendaList'

export default function DayAgenda({
  theme,
  agenda,
}: {
  theme: Theme
  agenda: AgendaItem[]
}) {
  return (
    <AgendaList
      theme={theme}
      label="Day agenda"
      ordered
      emptyText="No plans."
      entries={agenda.map((event) => ({
        id: `${event.id}-${event.start}`,
        title: event.title === 'Going to school' ? 'To School' : event.title,
        image: theme.activityImages?.[event.activity],
        timing: { kind: 'range', start: event.start, end: event.end },
        background:
          event.kind === 'activity'
            ? `${theme.colors.accent}30`
            : `${theme.colors.primary}08`,
      }))}
    />
  )
}
