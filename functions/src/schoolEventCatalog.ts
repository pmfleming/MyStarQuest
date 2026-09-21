// Shared by the calendar service and client, including responses from older deployments.
export const schoolEventArtworks = [
  'first-day',
  'parent-meeting',
  'start-meeting',
  'school-trip',
  'school-photo',
  'sibling-photo',
  'international-meeting',
  'christmas',
  'reports',
  'kings-games',
  'end-party',
  'early-finish',
  'council-meeting',
  'teacher-training',
  'summer-break',
  'autumn-break',
  'christmas-break',
  'spring-break',
  'may-break',
  'good-friday',
  'easter-monday',
  'whit-monday',
] as const
export type SchoolEventArtwork = (typeof schoolEventArtworks)[number]
export type SchoolEventKind = 'activity' | 'day-off' | 'early-finish'
export type SchoolEventDetails = {
  titleNl: string
  titleEn: string
  kind: SchoolEventKind
  artwork?: SchoolEventArtwork
  releaseTime?: string
}

export const classifySchoolEvent = (summary: string): SchoolEventDetails => {
  const titleNl = summary.trim()
  const text = titleNl.toLocaleLowerCase('nl').replace(/\s+/g, ' ')
  const activity = (
    titleEn: string,
    artwork: SchoolEventArtwork
  ): SchoolEventDetails => ({ titleNl, titleEn, kind: 'activity', artwork })
  const dayOff = (
    titleEn: string,
    artwork?: SchoolEventArtwork
  ): SchoolEventDetails => ({
    titleNl,
    titleEn,
    kind: 'day-off',
    ...(artwork ? { artwork } : {}),
  })

  if (/^alle leerlingen (?:om )?12:00 uur vrij$/.test(text))
    return {
      titleNl,
      titleEn: 'Noon Finish',
      kind: 'early-finish',
      artwork: 'early-finish',
      releaseTime: '12:00',
    }
  if (/^studiedag\b/.test(text))
    return dayOff('Teacher Training', 'teacher-training')
  const holidays: Record<string, [string, SchoolEventArtwork?]> = {
    zomervakantie: ['Summer Break', 'summer-break'],
    herfstvakantie: ['Autumn Break', 'autumn-break'],
    kerstvakantie: ['Christmas Break', 'christmas-break'],
    voorjaarsvakantie: ['Spring Break', 'spring-break'],
    meivakantie: ['May Break', 'may-break'],
    'goede vrijdag': ['Good Friday', 'good-friday'],
    'tweede paasdag': ['Easter Monday', 'easter-monday'],
    'tweede pinksterdag': ['Whit Monday', 'whit-monday'],
    holiday: ['Holiday'],
  }
  if (holidays[text]) return dayOff(...holidays[text])
  if (text === 'eerste schooldag') return activity('School Starts', 'first-day')
  if (text.includes('internationale ouders'))
    return activity('Parent Welcome', 'international-meeting')
  if (/^informatie\s?bijeenkomst groep 1-2$/.test(text))
    return activity('Parent Meeting', 'parent-meeting')
  if (text === '1-2a startgesprekken (met kind)')
    return activity('Start Meeting', 'start-meeting')
  if (/^schoolreis\b/.test(text)) return activity('School Trip', 'school-trip')
  if (text === 'schoolfotograaf broertjes/zusjes')
    return activity('Sibling Photos', 'sibling-photo')
  if (text === 'schoolfotograaf')
    return activity('School Photos', 'school-photo')
  if (/^kerstviering\b/.test(text))
    return activity('Christmas Party', 'christmas')
  if (text === 'rapporten mee naar huis')
    return activity('School Reports', 'reports')
  if (text === 'koningsspelen') return activity('King’s Games', 'kings-games')
  if (text === 'eindfeest') return activity('School Party', 'end-party')
  if (text === 'mr vergadering')
    return activity('Council Meeting', 'council-meeting')
  // Unknown events remain visible; an all-day flag alone never means school is closed.
  return { titleNl, titleEn: 'School Event', kind: 'activity' }
}
