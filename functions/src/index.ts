/**
 * Scheduled Cloud Function: generateDailyTodos
 *
 * Runs every day at 00:05 (Europe/London) and creates TodoRecords for each user's
 * children based on their task templates and the current day type.
 *
 * Uses a Firestore query on (sourceTaskId + dateKey) to prevent duplicates,
 * so even if the function fires twice it will not create duplicate todos.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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
  task: { schoolDayEnabled?: boolean; nonSchoolDayEnabled?: boolean },
  dayType: CurrentDayType
) =>
  dayType === 'schoolday'
    ? task.schoolDayEnabled === true
    : task.nonSchoolDayEnabled === true

// ── Defaults (mirrors client-side types.ts) ──

const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
const DEFAULT_DINNER_BITES = 2
const DEFAULT_MATH_PROBLEMS = 5
const DEFAULT_PV_PROBLEMS = 5
const DEFAULT_ALPHABET_PROBLEMS = 5

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

        // Get all task templates for this child
        const tasksSnapshot = await db
          .collection(`users/${uid}/tasks`)
          .where('childId', '==', childId)
          .get()

        // Get existing todos for today (to deduplicate)
        const existingTodosSnapshot = await db
          .collection(`users/${uid}/todos`)
          .where('childId', '==', childId)
          .where('dateKey', '==', dateKey)
          .get()

        const existingSourceIds = new Set(
          existingTodosSnapshot.docs.map((d) => d.data().sourceTaskId)
        )

        // Filter to scheduled tasks with non-empty titles that don't already have a todo
        const todosToCreate = tasksSnapshot.docs.filter((taskDoc) => {
          const data = taskDoc.data()
          const title = (data.title ?? '').trim()
          if (!title) return false
          if (existingSourceIds.has(taskDoc.id)) return false
          return isScheduledForDay(data as ScheduledTaskData, dayType)
        })

        if (todosToCreate.length === 0) continue

        // Batch-write to stay within Firestore limits (max 500 per batch)
        const batch = db.batch()

        for (const taskDoc of todosToCreate) {
          const data = taskDoc.data()
          const isLegacyDayNight =
            data.taskType === 'daynight' || data.category === 'daynight'

          if (isLegacyDayNight) continue

          const taskType =
            data.taskType === 'positional-notation' ||
            data.category === 'positional-notation'
              ? 'positional-notation'
              : data.taskType === 'math' || data.category === 'math'
                ? 'math'
                : data.taskType === 'alphabet' || data.category === 'alphabet'
                  ? 'alphabet'
                  : data.taskType === 'eating' || data.category === 'eating'
                    ? 'eating'
                    : 'standard'

          const dinnerDuration =
            data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
          const dinnerBites = data.dinnerTotalBites ?? DEFAULT_DINNER_BITES

          const base = {
            title: data.title ?? '',
            childId,
            sourceTaskId: taskDoc.id,
            sourceTaskType: taskType,
            starValue: Number(data.starValue ?? 1),
            schoolDayEnabled: data.schoolDayEnabled ?? true,
            nonSchoolDayEnabled: data.nonSchoolDayEnabled ?? true,
            autoAdded: true,
            dateKey,
            createdAt: FieldValue.serverTimestamp(),
            completedAt: null,
          }

          let taskSpecific: Record<string, unknown> = {}
          switch (taskType) {
            case 'eating':
              taskSpecific = {
                dinnerDurationSeconds: dinnerDuration,
                dinnerRemainingSeconds: dinnerDuration,
                dinnerTotalBites: dinnerBites,
                dinnerBitesLeft: dinnerBites,
              }
              break
            case 'math':
              taskSpecific = {
                mathTotalProblems:
                  data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                mathDifficulty: data.mathDifficulty ?? 'easy',
                mathLastOutcome: null,
              }
              break
            case 'alphabet':
              taskSpecific = {
                alphabetTotalProblems:
                  data.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
                alphabetLastOutcome: null,
              }
              break
            case 'positional-notation':
              taskSpecific = {
                pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                pvLastOutcome: null,
              }
              break
          }

          const todoRef = db.collection(`users/${uid}/todos`).doc()
          batch.set(todoRef, { ...base, ...taskSpecific })
        }

        await batch.commit()
        console.log(
          `Created ${todosToCreate.length} todos for user=${uid} child=${childId} date=${dateKey}`
        )
      }
    }
  }
)

// ── Callable function: reset today's todos for a specific child ──

export const resetTodayTodos = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in.')
  }

  const { childId } = request.data as { childId?: string }
  if (!childId || typeof childId !== 'string') {
    throw new HttpsError('invalid-argument', 'childId is required.')
  }

  // Verify the child belongs to this user
  const childDoc = await db.doc(`users/${uid}/children/${childId}`).get()
  if (!childDoc.exists) {
    throw new HttpsError('not-found', 'Child not found.')
  }

  // ⏰ Use the timezone-aware helper!
  const { dateKey, dayType } = getLocalizedDateInfo('Europe/London')

  // Delete all existing non-completed todos for today
  const existingTodos = await db
    .collection(`users/${uid}/todos`)
    .where('childId', '==', childId)
    .where('dateKey', '==', dateKey)
    .get()

  const deleteBatch = db.batch()
  for (const todoDoc of existingTodos.docs) {
    if (!todoDoc.data().completedAt) {
      deleteBatch.delete(todoDoc.ref)
    }
  }
  await deleteBatch.commit()

  // Get completed source task IDs (so we don't recreate those)
  const completedSourceIds = new Set(
    existingTodos.docs
      .filter((d) => d.data().completedAt)
      .map((d) => d.data().sourceTaskId)
  )

  // Get all task templates for this child
  const tasksSnapshot = await db
    .collection(`users/${uid}/tasks`)
    .where('childId', '==', childId)
    .get()

  const todosToCreate = tasksSnapshot.docs.filter((taskDoc) => {
    const data = taskDoc.data()
    const title = (data.title ?? '').trim()
    if (!title) return false
    if (completedSourceIds.has(taskDoc.id)) return false
    return isScheduledForDay(data as ScheduledTaskData, dayType)
  })

  if (todosToCreate.length === 0) return { created: 0 }

  const createBatch = db.batch()

  for (const taskDoc of todosToCreate) {
    const data = taskDoc.data()
    const isLegacyDayNight =
      data.taskType === 'daynight' || data.category === 'daynight'

    if (isLegacyDayNight) continue

    const taskType =
      data.taskType === 'positional-notation' ||
      data.category === 'positional-notation'
        ? 'positional-notation'
        : data.taskType === 'math' || data.category === 'math'
          ? 'math'
          : data.taskType === 'alphabet' || data.category === 'alphabet'
            ? 'alphabet'
            : data.taskType === 'eating' || data.category === 'eating'
              ? 'eating'
              : 'standard'

    const dinnerDuration =
      data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    const dinnerBites = data.dinnerTotalBites ?? DEFAULT_DINNER_BITES

    const base = {
      title: data.title ?? '',
      childId,
      sourceTaskId: taskDoc.id,
      sourceTaskType: taskType,
      starValue: Number(data.starValue ?? 1),
      schoolDayEnabled: data.schoolDayEnabled ?? true,
      nonSchoolDayEnabled: data.nonSchoolDayEnabled ?? true,
      autoAdded: true,
      dateKey,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
    }

    let taskSpecific: Record<string, unknown> = {}
    switch (taskType) {
      case 'eating':
        taskSpecific = {
          dinnerDurationSeconds: dinnerDuration,
          dinnerRemainingSeconds: dinnerDuration,
          dinnerTotalBites: dinnerBites,
          dinnerBitesLeft: dinnerBites,
        }
        break
      case 'math':
        taskSpecific = {
          mathTotalProblems: data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
          mathDifficulty: data.mathDifficulty ?? 'easy',
          mathLastOutcome: null,
        }
        break
      case 'alphabet':
        taskSpecific = {
          alphabetTotalProblems:
            data.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
          alphabetLastOutcome: null,
        }
        break
      case 'positional-notation':
        taskSpecific = {
          pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
          pvLastOutcome: null,
        }
        break
    }

    const todoRef = db.collection(`users/${uid}/todos`).doc()
    createBatch.set(todoRef, { ...base, ...taskSpecific })
  }

  await createBatch.commit()
  console.log(
    `Reset: created ${todosToCreate.length} todos for user=${uid} child=${childId} date=${dateKey}`
  )
  return { created: todosToCreate.length }
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
