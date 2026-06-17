/**
 * Scheduled Cloud Function: generateDailyTodos
 *
 * Runs every day at 00:05 (Europe/London) and resets each user's current
 * chore documents for the new day.
 */

import { initializeApp } from 'firebase-admin/app'
import {
  getFirestore,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import * as ical from 'node-ical'

initializeApp()
const db = getFirestore()

// ── Day-type & Timezone helpers ──

type CurrentDayType = 'schoolday' | 'nonschoolday'

type ScheduledTaskData = {
  schoolDayEnabled?: boolean
  nonSchoolDayEnabled?: boolean
  dayType?: unknown
}

/**
 * Calculates the exact dateKey and dayType for a specific timezone.
 * This prevents UTC-offset bugs where the server thinks it's a different day
 * than the user's local time (e.g., during British Summer Time).
 */
const getLocalizedDateInfo = (timeZone: string) => {
  const now = new Date()

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short', // Outputs 'Mon', 'Tue', 'Sat', 'Sun', etc.
  })

  const parts = formatter.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  const weekday = parts.find((p) => p.type === 'weekday')?.value

  const dateKey = `${year}-${month}-${day}`
  const dayType: CurrentDayType =
    weekday === 'Sat' || weekday === 'Sun' ? 'nonschoolday' : 'schoolday'

  return { dateKey, dayType }
}

const isScheduledForDay = (
  task: ScheduledTaskData,
  dayType: CurrentDayType
) => {
  const hasExplicitToggles =
    typeof task.schoolDayEnabled === 'boolean' ||
    typeof task.nonSchoolDayEnabled === 'boolean'

  if (hasExplicitToggles) {
    return dayType === 'schoolday'
      ? task.schoolDayEnabled === true
      : task.nonSchoolDayEnabled === true
  }

  const storedDayType = String(task.dayType ?? '').toLowerCase()
  if (storedDayType === 'weekday' || storedDayType === 'schoolday') {
    return dayType === 'schoolday'
  }
  if (storedDayType === 'weekend' || storedDayType === 'nonschoolday') {
    return dayType === 'nonschoolday'
  }

  return true
}

// ── Defaults (mirrors client-side types.ts) ──

const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
const DEFAULT_DINNER_BITES = 2
const DEFAULT_WATER_LEVEL = 'full'
const DEFAULT_TOILET_STATUS = 'notpeepee'

type ActivityType =
  | 'standard'
  | 'eating'
  | 'watertoiletcheck'
  | 'math'
  | 'large-numbers'
  | 'positional-notation'
  | 'alphabet'
  | 'spelling'

const getActivityType = (data: DocumentData): ActivityType => {
  const explicitType = data.taskType ?? data.choreType ?? data.testType
  const category = data.category

  if (
    explicitType === 'positional-notation' ||
    category === 'positional-notation'
  ) {
    return 'positional-notation'
  }
  if (explicitType === 'large-numbers' || category === 'large-numbers') {
    return 'large-numbers'
  }
  if (explicitType === 'math' || category === 'math') return 'math'
  if (explicitType === 'alphabet' || category === 'alphabet') return 'alphabet'
  if (explicitType === 'spelling' || category === 'spelling') {
    return 'spelling'
  }
  if (explicitType === 'watertoiletcheck' || category === 'watertoiletcheck') {
    return 'watertoiletcheck'
  }
  if (explicitType === 'eating' || category === 'eating') return 'eating'
  return 'standard'
}

const isChoreType = (type: ActivityType) =>
  type === 'standard' || type === 'eating' || type === 'watertoiletcheck'

const isLegacyDayNight = (data: DocumentData) =>
  data.taskType === 'daynight' ||
  data.choreType === 'daynight' ||
  data.testType === 'daynight' ||
  data.category === 'daynight'

const getTemplateDocs = async (uid: string, childId: string) => {
  const currentSnapshot = await db
    .collection(`users/${uid}/chores`)
    .where('childId', '==', childId)
    .get()

  const templateDocs = new Map<string, QueryDocumentSnapshot<DocumentData>>()

  for (const taskDoc of currentSnapshot.docs) {
    const data = taskDoc.data()
    if (isLegacyDayNight(data)) continue
    const taskType = getActivityType(data)
    if (isChoreType(taskType)) {
      templateDocs.set(taskDoc.id, taskDoc)
    }
  }

  return Array.from(templateDocs.values())
}

const createDailyActivities = async (
  uid: string,
  childId: string,
  dayType: CurrentDayType
) => {
  const templates = await getTemplateDocs(uid, childId)

  const choresToReset = templates.filter((taskDoc) => {
    const data = taskDoc.data()
    const title = (data.title ?? '').trim()
    const taskType = getActivityType(data)
    if (!title) return false
    if (!isChoreType(taskType)) return false
    return isScheduledForDay(data as ScheduledTaskData, dayType)
  })

  if (choresToReset.length === 0) return 0

  const batch = db.batch()

  for (const taskDoc of choresToReset) {
    batch.update(taskDoc.ref, getDailyActivityResetPatch(taskDoc.data()))
  }

  await batch.commit()
  return choresToReset.length
}

// ── Scheduled function ──

export const generateDailyTodos = onSchedule(
  { schedule: '5 0 * * *', timeZone: 'Europe/London' },
  async () => {
    // ⏰ Use the timezone-aware helper!
    const { dateKey, dayType } = getLocalizedDateInfo('Europe/London')

    // Iterate all users
    const usersSnapshot = await db.collection('users').listDocuments()

    for (const userRef of usersSnapshot) {
      const uid = userRef.id

      // Get all children for the user
      const childrenSnapshot = await db
        .collection(`users/${uid}/children`)
        .get()

      for (const childDoc of childrenSnapshot.docs) {
        const childId = childDoc.id

        const created = await createDailyActivities(uid, childId, dayType)
        console.log(
          `Reset ${created} chores for user=${uid} child=${childId} date=${dateKey}`
        )
      }
    }
  }
)

const resetTodayActivities = async (uid: string, childId: string) => {
  const { dateKey, dayType } = getLocalizedDateInfo('Europe/London')

  const chores = await getTemplateDocs(uid, childId)

  const resetBatch = db.batch()
  let updated = 0

  for (const choreDoc of chores) {
    const data = choreDoc.data()
    const taskType = getActivityType(data)
    if (!isChoreType(taskType)) continue
    if (!isScheduledForDay(data as ScheduledTaskData, dayType)) continue

    resetBatch.update(choreDoc.ref, getDailyActivityResetPatch(data))
    updated += 1
  }

  if (updated > 0) {
    await resetBatch.commit()
  }

  console.log(
    `Reset: refreshed ${updated} chores for user=${uid} child=${childId} date=${dateKey}`
  )
  return { created: 0, refreshed: updated }
}

const getDailyActivityResetPatch = (data: DocumentData) => {
  const taskType = getActivityType(data)

  if (taskType === 'eating') {
    const duration =
      data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    const bites = data.dinnerTotalBites ?? DEFAULT_DINNER_BITES
    return {
      manageDinnerCompletedAt: null,
      manageDinnerRemainingSeconds: duration,
      manageDinnerBitesLeft: bites,
      manageDinnerTimerStartedAt: null,
    }
  }

  if (taskType === 'watertoiletcheck') {
    return {
      manageWaterToiletCompletedAt: null,
      manageWaterLevel: DEFAULT_WATER_LEVEL,
      manageToiletStatus: DEFAULT_TOILET_STATUS,
    }
  }

  return { manageCompletedAt: null }
}

const assertCallableChild = async (
  uid: string | undefined,
  childId: unknown
) => {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in.')
  }

  if (!childId || typeof childId !== 'string') {
    throw new HttpsError('invalid-argument', 'childId is required.')
  }

  const childDoc = await db.doc(`users/${uid}/children/${childId}`).get()
  if (!childDoc.exists) {
    throw new HttpsError('not-found', 'Child not found.')
  }

  return childId
}

// ── Callable functions: reset today's activities for a specific child ──

export const resetTodayChores = onCall(async (request) => {
  const uid = request.auth?.uid
  const { childId } = request.data as { childId?: string }
  const verifiedChildId = await assertCallableChild(uid, childId)
  return resetTodayActivities(uid!, verifiedChildId)
})

export const resetTodayTodos = onCall(async (request) => {
  const uid = request.auth?.uid
  const { childId } = request.data as { childId?: string }
  const verifiedChildId = await assertCallableChild(uid, childId)
  const chores = await resetTodayActivities(uid!, verifiedChildId)
  return { created: chores.created, chores }
})

// ── HTTP function: parse & serve school calendar as JSON ──

// Base URL without the static ?noCache parameter
const SCHOOL_CALENDAR_BASE_URL =
  'https://calendar.parro.com/ical/4885298933/8eaf8fb5-1f77-4a8b-bb79-8d8b404f4943'

type CalendarDayPayload = {
  summaries: string[]
  hasAllDayEvent: boolean
  isNonSchoolDay: boolean
}

export const getSchoolCalendar = onRequest(
  { cors: true },
  async (_req, res): Promise<void> => {
    try {
      // 1. Dynamic Cache Busting
      const targetUrl = `${SCHOOL_CALENDAR_BASE_URL}?noCache=${Date.now()}`

      // 2. Enforce an 8-second timeout so the Cloud Function doesn't hang
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const calResponse = await fetch(targetUrl, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // Clear timeout if fetch succeeds

      if (!calResponse.ok) {
        throw new Error(`Parro responded with HTTP ${calResponse.status}`)
      }

      const calText = await calResponse.text()

      // 3. Defensive Parsing
      let events
      try {
        events = ical.sync.parseICS(calText)
      } catch (parseError) {
        console.error(
          'Failed to parse the ICS file. It might be malformed.',
          parseError
        )
        res
          .status(502)
          .json({ error: 'Received invalid calendar data from upstream.' })
        return
      }

      const parsedCalendar: Record<string, CalendarDayPayload> = {}

      // Format dates in the school's timezone to avoid UTC off-by-one errors
      const nlFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      const formatDate = (date: Date) => nlFormatter.format(date)
      const isWeekendDateKey = (dateKey: string) => {
        const dayOfWeek = new Date(`${dateKey}T00:00:00Z`).getUTCDay()
        return dayOfWeek === 0 || dayOfWeek === 6
      }

      const appendSummary = (
        date: Date,
        summary: string,
        hasAllDayEvent: boolean
      ) => {
        const dateKey = formatDate(date)
        const isWeekday = !isWeekendDateKey(dateKey)

        // Weekends are always non-school; weekdays are non-school if they have an all-day event
        const isNonSchoolDay = !isWeekday || hasAllDayEvent

        const existing = parsedCalendar[dateKey]

        if (!existing) {
          parsedCalendar[dateKey] = {
            summaries: [summary],
            hasAllDayEvent,
            isNonSchoolDay,
          }
          return
        }

        if (!existing.summaries.includes(summary)) {
          existing.summaries.push(summary)
        }

        // Carry over truthy values from overlapping events on the same day
        existing.hasAllDayEvent = existing.hasAllDayEvent || hasAllDayEvent
        existing.isNonSchoolDay = existing.isNonSchoolDay || isNonSchoolDay
      }

      for (const key of Object.keys(events)) {
        const event = events[key]
        if (!event || event.type !== 'VEVENT') continue

        const vevent = event as ical.VEvent
        const rawSummary = vevent.summary
        const summary: string =
          typeof rawSummary === 'string'
            ? rawSummary
            : (rawSummary?.val ?? 'School Event')

        // iCal specifies all-day events with datetype 'date' (vs 'date-time')
        const hasAllDayEvent = vevent.datetype === 'date'

        if (vevent.start) {
          const startDate = new Date(vevent.start)
          const endDate = vevent.end
            ? new Date(vevent.end)
            : new Date(vevent.start)

          // Capture the exact duration of the event for potential recurrences
          const durationMs = endDate.getTime() - startDate.getTime()

          // --- PROCESS THE INITIAL EVENT ---
          const currentDate = new Date(startDate.getTime())

          // iCal all-day events use an exclusive end date, so use strict <
          while (currentDate < endDate) {
            appendSummary(currentDate, summary, hasAllDayEvent)
            // Use setUTCDate to mathematically increment 24 hours safely
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
          }

          // Single-instant events where start === end (duration is 0)
          if (formatDate(startDate) === formatDate(endDate)) {
            appendSummary(endDate, summary, hasAllDayEvent)
          }

          // --- PROCESS RECURRING EVENTS ---
          if (vevent.rrule) {
            const now = new Date()
            const nextYear = new Date(
              now.getFullYear() + 1,
              now.getMonth(),
              now.getDate()
            )
            const occurrenceStarts = vevent.rrule.between(now, nextYear)

            for (const occStart of occurrenceStarts) {
              // Reconstruct the multiday end date for THIS specific occurrence
              const occEnd = new Date(occStart.getTime() + durationMs)
              const currOcc = new Date(occStart.getTime())

              while (currOcc < occEnd) {
                appendSummary(currOcc, summary, hasAllDayEvent)
                currOcc.setUTCDate(currOcc.getUTCDate() + 1)
              }

              if (formatDate(occStart) === formatDate(occEnd)) {
                appendSummary(occEnd, summary, hasAllDayEvent)
              }
            }
          }
        }
      }

      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      res.set('Content-Type', 'application/json')
      res.status(200).json(parsedCalendar)
      return
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Fetch request to Parro timed out.')
        res.status(504).json({ error: 'Upstream calendar service timed out.' })
        return
      }

      console.error('Error fetching/parsing school calendar:', error)
      res.status(500).json({ error: 'Unable to fetch school calendar.' })
      return
    }
  }
)
