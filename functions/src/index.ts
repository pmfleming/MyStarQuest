/**
 * Scheduled Cloud Function: generateDailyTodos
 *
 * Runs every day at 00:05 (UTC) and creates TodoRecords for each user's
 * children based on their task templates and the current day type.
 *
 * Uses a Firestore query on (sourceTaskId + dateKey) to prevent duplicates,
 * so even if the function fires twice it will not create duplicate todos.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

initializeApp()
const db = getFirestore()

// ── Day-type helpers (mirrors client-side today.ts) ──

type CurrentDayType = 'schoolday' | 'nonschoolday'

const padDatePart = (value: number) => String(value).padStart(2, '0')

const buildDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  return `${year}-${month}-${day}`
}

const getCurrentDayType = (date: Date): CurrentDayType => {
  const dow = date.getDay()
  return dow === 0 || dow === 6 ? 'nonschoolday' : 'schoolday'
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

// ── Scheduled function ──

export const generateDailyTodos = onSchedule(
  { schedule: '5 0 * * *', timeZone: 'Europe/London' },
  async () => {
    const now = new Date()
    const dateKey = buildDateKey(now)
    const dayType = getCurrentDayType(now)

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
          return isScheduledForDay(data, dayType)
        })

        if (todosToCreate.length === 0) continue

        // Batch-write to stay within Firestore limits (max 500 per batch)
        const batch = db.batch()

        for (const taskDoc of todosToCreate) {
          const data = taskDoc.data()
          const taskType =
            data.taskType === 'positional-notation' ||
            data.category === 'positional-notation'
              ? 'positional-notation'
              : data.taskType === 'math' || data.category === 'math'
                ? 'math'
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
                mathLastOutcome: null,
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
