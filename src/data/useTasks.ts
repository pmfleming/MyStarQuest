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
  getManageDinnerRemaining,
  isEatingTask,
  isMathTask,
  isPositionalNotationTask,
  type TaskRecord,
  type TaskUpdatableFields,
} from './types'

export function useTasks() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

  // ── Subscription ──
  useEffect(() => {
    if (!user) {
      setTasks([])
      return
    }

    const taskQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(taskQuery, (snapshot) => {
      const newTasks: TaskRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        const taskType: TaskRecord['taskType'] =
          data.taskType === 'positional-notation' ||
          data.category === 'positional-notation'
            ? 'positional-notation'
            : data.taskType === 'math' || data.category === 'math'
              ? 'math'
              : data.taskType === 'eating' || data.category === 'eating'
                ? 'eating'
                : 'standard'
        return {
          id: docSnapshot.id,
          title: data.title ?? '',
          childId: data.childId ?? '',
          category: data.category ?? '',
          taskType,
          ...normalizeChoreSchedule(data),
          starValue: Number(data.starValue ?? 1),
          isRepeating: data.isRepeating ?? false,
          manageCompletedAt: data.manageCompletedAt ?? null,
          dinnerDurationSeconds:
            data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
          dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
          manageDinnerRemainingSeconds:
            data.manageDinnerRemainingSeconds ??
            data.dinnerRemainingSeconds ??
            data.dinnerDurationSeconds ??
            DEFAULT_DINNER_DURATION_SECONDS,
          manageDinnerBitesLeft:
            data.manageDinnerBitesLeft ??
            data.dinnerBitesLeft ??
            data.dinnerTotalBites ??
            DEFAULT_DINNER_BITES,
          manageDinnerCompletedAt:
            data.manageDinnerCompletedAt ?? data.dinnerCompletedAt ?? null,
          mathTotalProblems: data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
          manageMathCompletedAt:
            data.manageMathCompletedAt ?? data.mathCompletedAt ?? null,
          manageMathLastOutcome:
            data.manageMathLastOutcome ?? data.mathLastOutcome ?? null,
          pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
          managePVCompletedAt:
            data.managePVCompletedAt ?? data.pvCompletedAt ?? null,
          managePVLastOutcome:
            data.managePVLastOutcome ?? data.pvLastOutcome ?? null,
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setTasks(newTasks)

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
    const saved = tasks.find((t) => t.id === taskId)
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
      manageCompletedAt: null,
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
      manageDinnerRemainingSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      manageDinnerBitesLeft: DEFAULT_DINNER_BITES,
      manageDinnerCompletedAt: null,
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
      manageMathCompletedAt: null,
      manageMathLastOutcome: null,
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
      managePVCompletedAt: null,
      managePVLastOutcome: null,
      createdAt: serverTimestamp(),
    })
  }

  // ── Math handlers ──
  const mathComplete = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
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

  const mathFail = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
      manageMathCompletedAt: Date.now(),
      manageMathLastOutcome: 'failure',
    })
  }

  const mathReset = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
      manageMathCompletedAt: null,
      manageMathLastOutcome: null,
    })
  }

  // ── PV handlers ──
  const pvComplete = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
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

  const pvFail = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
      managePVCompletedAt: Date.now(),
      managePVLastOutcome: 'failure',
    })
  }

  const pvReset = async (task: TaskRecord) => {
    await updateTaskField(task.id, {
      managePVCompletedAt: null,
      managePVLastOutcome: null,
    })
  }

  // ── Dinner helpers ──
  const dinnerApplyBite = async (task: TaskRecord) => {
    const remaining = getManageDinnerRemaining(task)
    const bitesLeft = getManageDinnerBitesLeft(task)
    if (remaining <= 0 || bitesLeft <= 0) return

    const nextBites = Math.max(0, bitesLeft - 1)
    await updateTaskField(task.id, { manageDinnerBitesLeft: nextBites })

    if (nextBites === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 850))
      await updateTaskField(task.id, { manageDinnerCompletedAt: Date.now() })
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

  const dinnerTickTimer = async (task: TaskRecord) => {
    const remaining = getManageDinnerRemaining(task)
    if (remaining <= 0) return true // already done

    const nextRemaining = Math.max(0, remaining - 1)
    await updateTaskField(task.id, {
      manageDinnerRemainingSeconds: nextRemaining,
      ...(nextRemaining === 0 ? { manageDinnerCompletedAt: Date.now() } : {}),
    })
    return nextRemaining === 0
  }

  const dinnerReset = async (task: TaskRecord) => {
    const totalBites = task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
    const dur = task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    await updateTaskField(task.id, {
      manageDinnerBitesLeft: totalBites,
      manageDinnerRemainingSeconds: dur,
      manageDinnerCompletedAt: null,
    })
  }

  // ── Standard task award ──
  const awardTask = async (task: TaskRecord) => {
    if (!user || !activeChildId) {
      alert('Please select an explorer first.')
      return
    }
    await awardStars({
      userId: user.uid,
      childId: activeChildId,
      delta: task.starValue,
    })
    await updateTaskField(task.id, { manageCompletedAt: Date.now() })
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

  // ── Auto-reset manage-page completion state after 15 minutes ──
  useEffect(() => {
    if (!user) return

    const checkAndReset = () => {
      const now = Date.now()
      for (const task of tasks) {
        if (
          isEatingTask(task) &&
          task.manageDinnerCompletedAt &&
          now - task.manageDinnerCompletedAt >= MANAGE_STATUS_RESET_MS
        ) {
          const totalBites = task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
          const dur =
            task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
          updateTaskField(task.id, {
            manageDinnerBitesLeft: totalBites,
            manageDinnerRemainingSeconds: dur,
            manageDinnerCompletedAt: null,
          })
        }
        if (
          isMathTask(task) &&
          task.manageMathCompletedAt &&
          now - task.manageMathCompletedAt >= MANAGE_STATUS_RESET_MS
        ) {
          updateTaskField(task.id, {
            manageMathCompletedAt: null,
            manageMathLastOutcome: null,
          })
        }
        if (
          isPositionalNotationTask(task) &&
          task.managePVCompletedAt &&
          now - task.managePVCompletedAt >= MANAGE_STATUS_RESET_MS
        ) {
          updateTaskField(task.id, {
            managePVCompletedAt: null,
            managePVLastOutcome: null,
          })
        }
        if (
          !isEatingTask(task) &&
          !isMathTask(task) &&
          !isPositionalNotationTask(task) &&
          task.manageCompletedAt &&
          now - task.manageCompletedAt >= MANAGE_STATUS_RESET_MS
        ) {
          updateTaskField(task.id, { manageCompletedAt: null })
        }
      }
    }

    checkAndReset()
    const interval = window.setInterval(checkAndReset, 60 * 1000)
    return () => window.clearInterval(interval)
  }, [tasks, user])

  return {
    tasks,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateTaskField,
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
    dinnerTickTimer,
    dinnerReset,
    awardTask,
    deleteTask,
  }
}
