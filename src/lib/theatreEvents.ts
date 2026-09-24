import programme from '../data/calendar/theatre-2026.json'

// Flyer times are local to the venue, with no published end times.
// Keep these dated activities separate from the replaceable school feed.
export const theatreProgramme = programme

export const getTheatreEvents = (dateKey: string) =>
  programme.events.filter((event) => event.date === dateKey)
