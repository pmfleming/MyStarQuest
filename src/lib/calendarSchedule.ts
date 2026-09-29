import { z } from 'zod'
import defaultScheduleData from '../data/calendarSchedule.json'
import { buildDateKey } from './today'
import type { SchoolCalendarData } from './schoolCalendarData'
import { getSchoolReleaseTime } from './schoolCalendarData'

export const calendarActivitySchema = z.enum([
  'bedtime',
  'eatingBreakfast',
  'washingTeeth',
  'commute',
  'schooltime',
  'tableWork',
  'circleTime',
  'outdoorPlay',
  'fruitSnack',
  'choiceTime',
  'schoolLunch',
  'goingHome',
  'playing',
  'cooking',
  'eatingDinner',
  'computergames',
  'bathtime',
  'ballet',
  'swimming',
  'judo',
  'piano',
])
export type CalendarActivity = z.infer<typeof calendarActivitySchema>

const clockTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
export const timeToMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}
const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const eventSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    activity: calendarActivitySchema,
    kind: z.enum(['routine', 'school', 'activity']),
    start: clockTime,
    end: z.union([clockTime, z.literal('24:00')]),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .refine(
        (days) => new Set(days).size === days.length,
        'Duplicate weekday'
      ),
    schoolDaysOnly: z.boolean(),
    schoolDayPlan: z.literal('classroom').optional(),
  })
  .refine(
    (event) =>
      !event.schoolDayPlan ||
      (event.activity === 'schooltime' &&
        event.kind === 'school' &&
        event.schoolDaysOnly),
    {
      message: 'A classroom plan requires a school-day schooltime event',
      path: ['schoolDayPlan'],
    }
  )
  .refine((event) => timeToMinutes(event.start) < timeToMinutes(event.end), {
    message: 'End must be after start; split overnight events at midnight',
    path: ['end'],
  })

export const calendarScheduleSchema = z
  .object({
    version: z.literal(1),
    events: z.array(eventSchema),
  })
  .refine(
    ({ events }) => new Set(events.map(({ id }) => id)).size === events.length,
    {
      message: 'Event IDs must be unique',
      path: ['events'],
    }
  )
export type CalendarSchedule = z.infer<typeof calendarScheduleSchema>
export type CalendarEvent = CalendarSchedule['events'][number]
export type AgendaItem = CalendarEvent & {
  startMinute: number
  endMinute: number
}

export const DEFAULT_CALENDAR_SCHEDULE =
  calendarScheduleSchema.parse(defaultScheduleData)
export const CALENDAR_SCHEDULE_STORAGE_KEY = 'msq.calendarSchedule.v1'
export const CALENDAR_SCHEDULE_CHANGED = 'msq:calendar-schedule-changed'

// The bundled JSON remains the default until an editor explicitly saves an override.
export const loadCalendarSchedule = (): CalendarSchedule => {
  try {
    const raw = localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)
    if (raw) return calendarScheduleSchema.parse(JSON.parse(raw))
  } catch {
    // Invalid/unsupported data is preserved in storage; the default stays usable offline.
  }
  return DEFAULT_CALENDAR_SCHEDULE
}

// Let validation/storage failures reach the future editor so it never claims a failed save succeeded.
export const saveCalendarSchedule = (value: CalendarSchedule) => {
  const schedule = calendarScheduleSchema.parse(value)
  localStorage.setItem(CALENDAR_SCHEDULE_STORAGE_KEY, JSON.stringify(schedule))
  window.dispatchEvent(new Event(CALENDAR_SCHEDULE_CHANGED))
}

export const isSchoolDate = (date: Date, holidays: SchoolCalendarData) =>
  date.getDay() !== 0 &&
  date.getDay() !== 6 &&
  !holidays[buildDateKey(date)]?.isNonSchoolDay

const priority = { routine: 0, school: 1, activity: 2 }

const morningActivities = [
  ['tableWork', 'Table work'],
  ['circleTime', 'Circle time'],
  ['outdoorPlay', 'Play outside'],
  ['fruitSnack', 'Fruit snack'],
  ['choiceTime', 'Choice time'],
  ['outdoorPlay', 'Play outside'],
] as const
const afternoonActivities = [
  ['schoolLunch', 'Lunch'],
  ['circleTime', 'Circle time'],
  ['choiceTime', 'Choice time'],
] as const

// Divide each side of lunch as evenly as quarter-hour slots allow. Round shared
// boundaries so adjacent activities stay contiguous, preserving fixed endpoints.
const expandSchoolDay = (event: AgendaItem): AgendaItem[] => {
  if (!event.schoolDayPlan) return [event]
  const lunchMinute = timeToMinutes('12:15')
  const split = (
    start: number,
    end: number,
    activities: readonly (readonly [CalendarActivity, string])[],
    phase: string
  ): AgendaItem[] => {
    if (end <= start) return []
    const boundary = (index: number) => {
      if (index === 0) return start
      if (index === activities.length) return end
      const ideal = start + ((end - start) * index) / activities.length
      return Math.max(start, Math.min(end, Math.round(ideal / 15) * 15))
    }
    return activities.flatMap(([activity, title], index) => {
      const startMinute = boundary(index)
      const endMinute = boundary(index + 1)
      if (startMinute === endMinute) return []
      return [
        {
          ...event,
          id: `${event.id}-${phase}-${index + 1}`,
          activity,
          title,
          start: minutesToTime(startMinute),
          end: minutesToTime(endMinute),
          startMinute,
          endMinute,
        },
      ]
    })
  }
  return [
    ...split(
      event.startMinute,
      Math.min(event.endMinute, lunchMinute),
      morningActivities,
      'morning'
    ),
    ...split(
      Math.max(event.startMinute, lunchMinute),
      event.endMinute,
      afternoonActivities,
      'afternoon'
    ),
  ]
}

// Resolve recurring events into one timeline. Lessons replace routine time, and
// school replaces free play. Equal-priority conflicts prefer the later JSON entry.
export const getAgendaForDate = (
  schedule: CalendarSchedule,
  date: Date,
  holidays: SchoolCalendarData = {}
): AgendaItem[] => {
  const weekday = date.getDay()
  const schoolDay = isSchoolDate(date, holidays)
  const releaseTime = getSchoolReleaseTime(holidays[buildDateKey(date)])
  const releaseMinute = releaseTime ? timeToMinutes(releaseTime) : undefined
  const regularSchoolEnd = Math.max(
    0,
    ...schedule.events
      .filter(
        (event) =>
          event.schoolDaysOnly &&
          event.activity === 'schooltime' &&
          event.weekdays.includes(weekday)
      )
      .map((event) => timeToMinutes(event.end))
  )
  const events = schedule.events
    .filter(
      (event) =>
        event.weekdays.includes(weekday) && (!event.schoolDaysOnly || schoolDay)
    )
    .map((event) => {
      let startMinute = timeToMinutes(event.start)
      let endMinute = timeToMinutes(event.end)
      if (
        releaseMinute !== undefined &&
        releaseMinute < regularSchoolEnd &&
        event.schoolDaysOnly
      ) {
        if (event.activity === 'schooltime')
          endMinute = Math.min(endMinute, releaseMinute)
        if (
          (event.activity === 'commute' || event.activity === 'goingHome') &&
          startMinute >= regularSchoolEnd
        ) {
          const shift = regularSchoolEnd - releaseMinute
          startMinute -= shift
          endMinute -= shift
        }
      }
      return { ...event, startMinute, endMinute }
    })
    .filter((event) => event.endMinute > event.startMinute)
    .flatMap(expandSchoolDay)
  const boundaries = [
    ...new Set(events.flatMap((event) => [event.startMinute, event.endMinute])),
  ].sort((a, b) => a - b)
  const agenda: AgendaItem[] = []
  let previousBoundary: number | undefined
  for (const endMinute of boundaries) {
    const startMinute = previousBoundary
    previousBoundary = endMinute
    if (startMinute === undefined) continue
    const winner = events.reduce<AgendaItem | undefined>((current, event) => {
      if (event.startMinute > startMinute || event.endMinute < endMinute)
        return current
      return !current || priority[event.kind] >= priority[current.kind]
        ? event
        : current
    }, undefined)
    if (!winner) continue
    const previous = agenda.at(-1)
    if (previous?.id === winner.id && previous.endMinute === startMinute) {
      previous.endMinute = endMinute
      previous.end = minutesToTime(endMinute)
    } else {
      agenda.push({
        ...winner,
        startMinute,
        endMinute,
        start: minutesToTime(startMinute),
        end: minutesToTime(endMinute),
      })
    }
  }
  return agenda
}

export const getActivityAtMinute = (agenda: AgendaItem[], minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440
  return agenda.find(
    (event) => normalized >= event.startMinute && normalized < event.endMinute
  )
}
