import type { Theme } from '../contexts/ThemeContext'
import { getTheatreEvents, theatreProgramme } from '../lib/theatreEvents'
import { getTheatreEventImage } from '../ui/theatreEventAssets'
import AgendaList from './AgendaList'
import './TheatreEvents.css'

export default function TheatreEvents({
  dateKey,
  theme,
}: {
  dateKey: string
  theme: Theme
}) {
  const events = getTheatreEvents(dateKey)
  if (!events.length) return null

  return (
    <div className="theatre-events">
      <AgendaList
        theme={theme}
        label="Theatre activities"
        entries={events.map((event) => ({
          id: event.id,
          title: event.title,
          image: getTheatreEventImage(event.id),
          subtitle: `${event.minimumAge === 0 ? 'All ages' : `Ages ${event.minimumAge}+`} · ${event.price ?? '€10'}`,
          details: [
            event.performer,
            event.venue ?? theatreProgramme.venue,
            ...(!event.venue ? [theatreProgramme.address] : []),
            ...(event.note ? [event.note] : []),
          ],
          timing: { kind: 'single', time: event.start },
          background: `${theme.colors.accent}20`,
        }))}
      />
    </div>
  )
}
