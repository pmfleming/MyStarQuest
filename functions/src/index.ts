/**
 * Scheduled Cloud Function: generateDailyTodos
 *
 * Runs every day at 00:05 (Europe/London) and resets each user's current
 * chore documents for the new day.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, type DocumentData } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import * as ical from 'node-ical'
import { buildSchoolCalendar, fetchSchoolCalendarText } from './schoolCalendar'

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

const LEGACY_DAY_TYPES = new Map<string, CurrentDayType>([
  ['weekday', 'schoolday'],
  ['schoolday', 'schoolday'],
  ['weekend', 'nonschoolday'],
  ['nonschoolday', 'nonschoolday'],
])

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

  const storedDayType = LEGACY_DAY_TYPES.get(
    String(task.dayType ?? '').toLowerCase()
  )
  return storedDayType === undefined || storedDayType === dayType
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
  | 'fractions'
  | 'positional-notation'
  | 'alphabet'
  | 'spelling'

// Preserve legacy category/type precedence for existing documents.
const ACTIVITY_TYPE_PRIORITY: ActivityType[] = [
  'positional-notation',
  'large-numbers',
  'fractions',
  'math',
  'alphabet',
  'spelling',
  'watertoiletcheck',
  'eating',
]

const getActivityType = (data: DocumentData): ActivityType => {
  const explicitType: unknown = data.taskType ?? data.choreType ?? data.testType
  const category: unknown = data.category

  return (
    ACTIVITY_TYPE_PRIORITY.find(
      (type) => type === explicitType || type === category
    ) ?? 'standard'
  )
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

  return currentSnapshot.docs.filter((taskDoc) => {
    const data = taskDoc.data()
    return !isLegacyDayNight(data) && isChoreType(getActivityType(data))
  })
}

const resetChildChores = async (
  uid: string,
  childId: string,
  dayType: CurrentDayType,
  requireTitle = false
) => {
  const templates = await getTemplateDocs(uid, childId)

  const choresToReset = templates.filter((taskDoc) => {
    const data = taskDoc.data()
    const title: unknown = data.title
    if (requireTitle && (typeof title !== 'string' || !title.trim()))
      return false
    return isScheduledForDay(data, dayType)
  })

  // Each chunk is atomic. Stop and report a failed commit before starting another.
  for (let offset = 0; offset < choresToReset.length; offset += 500) {
    const batch = db.batch()
    for (const taskDoc of choresToReset.slice(offset, offset + 500))
      batch.update(taskDoc.ref, getDailyActivityResetPatch(taskDoc.data()))
    await batch.commit()
  }
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

        const created = await resetChildChores(uid, childId, dayType, true)
        console.log(
          `Reset ${created} chores for user=${uid} child=${childId} date=${dateKey}`
        )
      }
    }
  }
)

const resetTodayActivities = async (uid: string, childId: string) => {
  const { dateKey, dayType } = getLocalizedDateInfo('Europe/London')

  const updated = await resetChildChores(uid, childId, dayType)

  console.log(
    `Reset: refreshed ${updated} chores for user=${uid} child=${childId} date=${dateKey}`
  )
  return { created: 0, refreshed: updated }
}

const getDailyActivityResetPatch = (data: DocumentData) => {
  const taskType = getActivityType(data)

  if (taskType === 'eating') {
    const duration: unknown =
      data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    const bites: unknown = data.dinnerTotalBites ?? DEFAULT_DINNER_BITES
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

const assertCallableChild = async (uid: string | undefined, data: unknown) => {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in.')
  }

  const childId =
    data && typeof data === 'object' && 'childId' in data
      ? data.childId
      : undefined
  if (!childId || typeof childId !== 'string') {
    throw new HttpsError('invalid-argument', 'childId is required.')
  }

  const childDoc = await db.doc(`users/${uid}/children/${childId}`).get()
  if (!childDoc.exists) {
    throw new HttpsError('not-found', 'Child not found.')
  }

  return { uid, childId }
}

// ── Callable functions: reset today's activities for a specific child ──

export const resetTodayChores = onCall(async (request) => {
  const child = await assertCallableChild(request.auth?.uid, request.data)
  return resetTodayActivities(child.uid, child.childId)
})

export const resetTodayTodos = onCall(async (request) => {
  const child = await assertCallableChild(request.auth?.uid, request.data)
  const chores = await resetTodayActivities(child.uid, child.childId)
  return { created: chores.created, chores }
})

// ── HTTP function: parse & serve school calendar as JSON ──

// Base URL without the static ?noCache parameter
const SCHOOL_CALENDAR_BASE_URL =
  'https://calendar.parro.com/ical/4885298933/8eaf8fb5-1f77-4a8b-bb79-8d8b404f4943'

export const getSchoolCalendar = onRequest(
  { cors: true },
  async (_req, res): Promise<void> => {
    try {
      // 1. Dynamic Cache Busting
      const targetUrl = `${SCHOOL_CALENDAR_BASE_URL}?noCache=${Date.now()}`

      const calText = await fetchSchoolCalendarText(targetUrl)

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

      const parsedCalendar = buildSchoolCalendar(events)

      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      res.set('Content-Type', 'application/json')
      res.status(200).json(parsedCalendar)
      return
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        ['AbortError', 'TimeoutError'].includes(error.name)
      ) {
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
