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

type EventRule = [
  pattern: RegExp,
  titleEn: string,
  artwork?: SchoolEventArtwork,
  kind?: SchoolEventKind,
  releaseTime?: string,
]

// First match wins; keep broad patterns after any more specific variants.
const eventRules: EventRule[] = [
  [
    /^alle leerlingen (?:om )?12:00 uur vrij$/,
    'Noon Finish',
    'early-finish',
    'early-finish',
    '12:00',
  ],
  [/^studiedag\b/, 'Teacher Training', 'teacher-training', 'day-off'],
  [/^zomervakantie$/, 'Summer Break', 'summer-break', 'day-off'],
  [/^herfstvakantie$/, 'Autumn Break', 'autumn-break', 'day-off'],
  [/^kerstvakantie$/, 'Christmas Break', 'christmas-break', 'day-off'],
  [/^voorjaarsvakantie$/, 'Spring Break', 'spring-break', 'day-off'],
  [/^meivakantie$/, 'May Break', 'may-break', 'day-off'],
  [/^goede vrijdag$/, 'Good Friday', 'good-friday', 'day-off'],
  [/^tweede paasdag$/, 'Easter Monday', 'easter-monday', 'day-off'],
  [/^tweede pinksterdag$/, 'Whit Monday', 'whit-monday', 'day-off'],
  [/^holiday$/, 'Holiday', undefined, 'day-off'],
  [/^eerste schooldag$/, 'School Starts', 'first-day'],
  [/internationale ouders/, 'Parent Welcome', 'international-meeting'],
  [/^informatie\s?bijeenkomst groep 1-2$/, 'Parent Meeting', 'parent-meeting'],
  [/^1-2a startgesprekken \(met kind\)$/, 'Start Meeting', 'start-meeting'],
  [/^schoolreis\b/, 'School Trip', 'school-trip'],
  [/^schoolfotograaf broertjes\/zusjes$/, 'Sibling Photos', 'sibling-photo'],
  [/^schoolfotograaf$/, 'School Photos', 'school-photo'],
  [/^kerstviering\b/, 'Christmas Party', 'christmas'],
  [/^rapporten mee naar huis$/, 'School Reports', 'reports'],
  [/^koningsspelen$/, 'King’s Games', 'kings-games'],
  [/^eindfeest$/, 'School Party', 'end-party'],
  [/^mr vergadering$/, 'Council Meeting', 'council-meeting'],
]

export const classifySchoolEvent = (summary: string): SchoolEventDetails => {
  const titleNl = summary.trim()
  const text = titleNl.toLocaleLowerCase('nl').replace(/\s+/g, ' ')
  const rule = eventRules.find(([pattern]) => pattern.test(text))
  // Unknown events remain visible; an all-day flag alone never closes school.
  if (!rule) return { titleNl, titleEn: 'School Event', kind: 'activity' }
  const [, titleEn, artwork, kind = 'activity', releaseTime] = rule
  return {
    titleNl,
    titleEn,
    kind,
    ...(artwork ? { artwork } : {}),
    ...(releaseTime ? { releaseTime } : {}),
  }
}
