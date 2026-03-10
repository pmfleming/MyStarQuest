// ── Real-time task subscription + all task mutations ──

import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'
import { normalizeChoreSchedule } from '../utils/today'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_MATH_STARS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_PV_STARS,
  MANAGE_STATUS_RESET_MS,
  getManageDinnerBitesLeft,
  getManageDinnerLiveRemaining,
  isEatingTask,
  isMathTask,
  isPositionalNotationTask,
  type EatingTaskWithEphemeral,
  type MathTaskWithEphemeral,
  type PVTaskWithEphemeral,
  type StandardTaskWithEphemeral,
  type TaskEphemeralState,
  type TaskRecord,
  type TaskType,
  type TaskUpdatableFields,
  type TaskWithEphemeral,
} from './types'

export function useTasks() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [rawTasks, setRawTasks] = useState<TaskRecord[]>([])
  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

  // ── Subscription ──
  useEffect(() => {
    if (!user) {
      setRawTasks([])
      setEphemeral({})
      return
    }

    const taskQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(taskQuery, (snapshot) => {
      const newTasks: TaskRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        const taskType: TaskType =
          data.taskType === 'positional-notation' ||
          data.category === 'positional-notation'
            ? 'positional-notation'
            : data.taskType === 'math' || data.category === 'math'
              ? 'math'
              : data.taskType === 'eating' || data.category === 'eating'
                ? 'eating'
                : 'standard'
        const base = {
          id: docSnapshot.id,
          title: data.title ?? '',
          childId: data.childId ?? '',
          category: data.category ?? '',
          ...normalizeChoreSchedule(data),
          starValue: Number(data.starValue ?? 1),
          isRepeating: data.isRepeating ?? false,
          createdAt: data.createdAt?.toDate?.(),
        }
        switch (taskType) {
          case 'eating':
            return {
              ...base,
              taskType: 'eating' as const,
              dinnerDurationSeconds:
                data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
              dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
            }
          case 'math':
            return {
              ...base,
              taskType: 'math' as const,
              mathTotalProblems:
                data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
            }
          case 'positional-notation':
            return {
              ...base,
              taskType: 'positional-notation' as const,
              pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
            }
          default:
            return { ...base, taskType: 'standard' as const }
        }
      })

      setRawTasks(newTasks)

      setTitleDrafts((prev) => {
        const next = { ...prev }
        for (const t of newTasks) {
          if (!(t.id in next)) next[t.id] = t.title
        }
        return next
      })
    })

    return () => unsubscribe()
  }, [user])

  // ── Merge config tasks with in-memory ephemeral state ──
  const tasks = rawTasks.map(
    (t) => ({ ...t, ...ephemeral[t.id] }) as TaskWithEphemeral
  )

  // ── Ephemeral state helper (local only, no Firestore) ──
  const updateEphemeral = (
    taskId: string,
    patch: Partial<TaskEphemeralState>
  ) => {
    setEphemeral((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...patch },
    }))
  }

  // ── Generic field update ──
  const updateTaskField = async (
    taskId: string,
    field: TaskUpdatableFields
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'tasks'), taskId),
        field
      )
    } catch (error) {
      console.error('Failed to update chore', error)
    }
  }

  // ── Title draft helpers ──
  const setTitleDraft = (taskId: string, value: string) =>
    setTitleDrafts((prev) => ({ ...prev, [taskId]: value }))

  const commitTitle = (taskId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTaskField(taskId, { title: trimmed })
    }
    const saved = rawTasks.find((t) => t.id === taskId)
    if (trimmed.length === 0 && saved) {
      setTitleDrafts((prev) => ({ ...prev, [taskId]: saved.title }))
    }
  }

  // ── Create handlers ──
  const createChore = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: '',
      childId: activeChildId,
      category: '',
      taskType: 'standard',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: 1,
      isRepeating: true,
      createdAt: serverTimestamp(),
    })
  }

  const createEating = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Eating Dinner',
      childId: activeChildId,
      category: 'eating',
      taskType: 'eating',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_DINNER_STARS,
      isRepeating: true,
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
      createdAt: serverTimestamp(),
    })
  }

  const createMath = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Arithmetic',
      childId: activeChildId,
      category: 'math',
      taskType: 'math',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_MATH_STARS,
      isRepeating: true,
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      createdAt: serverTimestamp(),
    })
  }

  const createPositionalNotation = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Position Notation',
      childId: activeChildId,
      category: 'positional-notation',
      taskType: 'positional-notation',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_PV_STARS,
      isRepeating: true,
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      createdAt: serverTimestamp(),
    })
  }

  // ── Math handlers ──
  const mathComplete = async (task: MathTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageMathCompletedAt: Date.now(),
      manageMathLastOutcome: 'success',
    })
    if (user && activeChildId) {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: task.starValue,
      })
      celebrateSuccess()
    }
  }

  const mathFail = (task: MathTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageMathCompletedAt: Date.now(),
      manageMathLastOutcome: 'failure',
    })
  }

  const mathReset = (task: MathTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageMathCompletedAt: null,
      manageMathLastOutcome: null,
    })
  }

  // ── PV handlers ──
  const pvComplete = async (task: PVTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      managePVCompletedAt: Date.now(),
      managePVLastOutcome: 'success',
    })
    if (user && activeChildId) {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: task.starValue,
      })
      celebrateSuccess()
    }
  }

  const pvFail = (task: PVTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      managePVCompletedAt: Date.now(),
      managePVLastOutcome: 'failure',
    })
  }

  const pvReset = (task: PVTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      managePVCompletedAt: null,
      managePVLastOutcome: null,
    })
  }

  // ── Dinner helpers ──
  const dinnerApplyBite = async (task: EatingTaskWithEphemeral) => {
    const remaining = getManageDinnerLiveRemaining(task)
    const bitesLeft = getManageDinnerBitesLeft(task)
    if (remaining <= 0 || bitesLeft <= 0) return

    const nextBites = Math.max(0, bitesLeft - 1)
    updateEphemeral(task.id, { manageDinnerBitesLeft: nextBites })

    if (nextBites === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 850))
      updateEphemeral(task.id, {
        manageDinnerCompletedAt: Date.now(),
        manageDinnerTimerStartedAt: null,
      })
      if (user && activeChildId) {
        await awardStars({
          userId: user.uid,
          childId: activeChildId,
          delta: task.starValue,
        })
        celebrateSuccess()
      }
      return true // signals that dinner is complete
    }
    return false
  }

  const dinnerStartTimer = (task: EatingTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageDinnerTimerStartedAt: Date.now(),
    })
  }

  const dinnerTimerExpired = (task: EatingTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: 0,
      manageDinnerCompletedAt: Date.now(),
    })
  }

  const dinnerReset = (task: EatingTaskWithEphemeral) => {
    updateEphemeral(task.id, {
      manageDinnerBitesLeft: task.dinnerTotalBites,
      manageDinnerRemainingSeconds: task.dinnerDurationSeconds,
      manageDinnerCompletedAt: null,
      manageDinnerTimerStartedAt: null,
    })
  }

  // ── Standard task award ──
  const awardTask = async (task: StandardTaskWithEphemeral) => {
    if (!user || !activeChildId) {
      alert('Please select an explorer first.')
      return
    }
    await awardStars({
      userId: user.uid,
      childId: activeChildId,
      delta: task.starValue,
    })
    updateEphemeral(task.id, { manageCompletedAt: Date.now() })
    celebrateSuccess()
    if (!task.isRepeating) {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), task.id))
    }
  }

  // ── Delete ──
  const deleteTask = async (id: string) => {
    if (!user) return
    await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
  }

  // ── Auto-reset manage-page completion state after 15 minutes (local only) ──
  useEffect(() => {
    if (!user) return

    const checkAndReset = () => {
      const now = Date.now()
      setEphemeral((prev) => {
        let next = prev
        for (const task of rawTasks) {
          const e = prev[task.id]
          if (!e) continue

          if (
            isEatingTask(task) &&
            e.manageDinnerCompletedAt &&
            now - e.manageDinnerCompletedAt >= MANAGE_STATUS_RESET_MS
          ) {
            if (next === prev) next = { ...prev }
            next[task.id] = {
              ...next[task.id],
              manageDinnerBitesLeft: task.dinnerTotalBites,
              manageDinnerRemainingSeconds: task.dinnerDurationSeconds,
              manageDinnerCompletedAt: null,
              manageDinnerTimerStartedAt: null,
            }
          }
          if (
            isMathTask(task) &&
            e.manageMathCompletedAt &&
            now - e.manageMathCompletedAt >= MANAGE_STATUS_RESET_MS
          ) {
            if (next === prev) next = { ...prev }
            next[task.id] = {
              ...next[task.id],
              manageMathCompletedAt: null,
              manageMathLastOutcome: null,
            }
          }
          if (
            isPositionalNotationTask(task) &&
            e.managePVCompletedAt &&
            now - e.managePVCompletedAt >= MANAGE_STATUS_RESET_MS
          ) {
            if (next === prev) next = { ...prev }
            next[task.id] = {
              ...next[task.id],
              managePVCompletedAt: null,
              managePVLastOutcome: null,
            }
          }
          if (
            !isEatingTask(task) &&
            !isMathTask(task) &&
            !isPositionalNotationTask(task) &&
            e.manageCompletedAt &&
            now - e.manageCompletedAt >= MANAGE_STATUS_RESET_MS
          ) {
            if (next === prev) next = { ...prev }
            next[task.id] = { ...next[task.id], manageCompletedAt: null }
          }
        }
        return next
      })
    }

    checkAndReset()
    const interval = window.setInterval(checkAndReset, 60 * 1000)
    return () => window.clearInterval(interval)
  }, [rawTasks, user])

  return {
    tasks,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateTaskField,
    updateEphemeral,
    createChore,
    createEating,
    createMath,
    createPositionalNotation,
    mathComplete,
    mathFail,
    mathReset,
    pvComplete,
    pvFail,
    pvReset,
    dinnerApplyBite,
    dinnerStartTimer,
    dinnerTimerExpired,
    dinnerReset,
    awardTask,
    deleteTask,
  }
}
