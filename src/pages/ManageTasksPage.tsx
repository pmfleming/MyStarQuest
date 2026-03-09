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
import { useTheme } from '../contexts/ThemeContext'
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import ActionButton from '../components/ActionButton'
import StandardActionList from '../components/StandardActionList'
import StarDisplay from '../components/StarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import DinnerCountdown, {
  BITE_COOLDOWN_SECONDS,
} from '../components/DinnerCountdown'
import ArithmeticTester from '../components/ArithmeticTester'
import PositionalNotationTester from '../components/PositionalNotationTaskTester'
import { uiTokens } from '../ui/tokens'
import { getSeasonForDate, normalizeChoreSchedule } from '../utils/today'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessEatingLunchIcon,
  princessGiveStarIcon,
  princessMathsIcon,
  princessMathsCorrectImage,
  princessMathsIncorrectImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessPlateImage,
  princessResetIcon,
  princessSchoolDayImage,
} from '../assets/themes/princess/assets'

// --- Types ---
type TaskRecord = {
  id: string
  title: string
  childId: string
  category: string
  taskType: 'standard' | 'eating' | 'math' | 'positional-notation'
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  isRepeating: boolean
  manageCompletedAt?: number | null
  dinnerDurationSeconds?: number
  dinnerTotalBites?: number
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerCompletedAt?: number | null
  mathTotalProblems?: number
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: 'success' | 'failure' | null
  pvTotalProblems?: number
  managePVCompletedAt?: number | null
  managePVLastOutcome?: 'success' | 'failure' | null
  createdAt?: Date
}

const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
const DEFAULT_DINNER_BITES = 2
const DEFAULT_DINNER_STARS = 3
const DEFAULT_MATH_PROBLEMS = 5
const DEFAULT_MATH_STARS = 3
const DEFAULT_PV_PROBLEMS = 5
const DEFAULT_PV_STARS = 3
const MANAGE_STATUS_RESET_MS = 15 * 60 * 1000

const princessBiteIconCycle = [
  princessBiteIcon,
  princessEatingBreakfastIcon,
  princessEatingLunchIcon,
  princessEatingDinnerIcon,
]

const getPrincessCooldownIconForHour = (hour: number) => {
  if (hour < 10) return princessEatingBreakfastIcon
  if (hour < 16) return princessEatingLunchIcon
  return princessEatingDinnerIcon
}

const getPrincessNonSchoolDayImage = (
  season: ReturnType<typeof getSeasonForDate>
) => {
  switch (season) {
    case 'spring':
      return princessNonSchoolDaySpringImage
    case 'summer':
      return princessNonSchoolDaySummerImage
    case 'autumn':
      return princessNonSchoolDayAutumnImage
    case 'winter':
    default:
      return princessNonSchoolDayWinterImage
  }
}

const ManageTasksPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isAwarding, setIsAwarding] = useState(false)
  const [activeDinnerTaskId, setActiveDinnerTaskId] = useState<string | null>(
    null
  )
  const [activeMathTaskId, setActiveMathTaskId] = useState<string | null>(null)
  const [activePVTaskId, setActivePVTaskId] = useState<string | null>(null)
  const [mathCheckTriggerByTask, setMathCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggerByTask, setPVCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [showAddChooser, setShowAddChooser] = useState(false)

  // Bite cooldown: prevents rapid tapping (one bite per 20 s)
  const [biteCooldownSeconds, setBiteCooldownSeconds] = useState(0)
  const [pendingDinnerBiteTaskId, setPendingDinnerBiteTaskId] = useState<
    string | null
  >(null)
  const [biteCooldownTestIconIndex, setBiteCooldownTestIconIndex] = useState<
    number | null
  >(null)

  // Local title state keyed by task id, used for controlled inputs
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})
  const currentSeason = getSeasonForDate(new Date())
  const princessNonSchoolDayImage = getPrincessNonSchoolDayImage(currentSeason)

  // Tick down bite cooldown every second
  useEffect(() => {
    if (biteCooldownSeconds <= 0) return
    const timer = window.setTimeout(() => {
      setBiteCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [biteCooldownSeconds])

  // Clear cooldown when the dinner game ends (timer stops or bites finish)
  useEffect(() => {
    if (!activeDinnerTaskId && !pendingDinnerBiteTaskId) {
      setBiteCooldownSeconds(0)
      setBiteCooldownTestIconIndex(null)
    }
  }, [activeDinnerTaskId, pendingDinnerBiteTaskId])

  // Apply bite only after cooldown completes
  useEffect(() => {
    if (!pendingDinnerBiteTaskId || biteCooldownSeconds > 0) return

    const applyBiteAfterCooldown = async () => {
      const taskId = pendingDinnerBiteTaskId
      setPendingDinnerBiteTaskId(null)

      const task = tasks.find((item) => item.id === taskId)
      if (!task || !isEatingTask(task)) return

      const remaining = getManageDinnerRemaining(task)
      const bitesLeft = getManageDinnerBitesLeft(task)
      if (remaining <= 0 || bitesLeft <= 0) return

      const nextBites = Math.max(0, bitesLeft - 1)
      await updateTaskField(task.id, { manageDinnerBitesLeft: nextBites })

      if (nextBites === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 850))
        await updateTaskField(task.id, { manageDinnerCompletedAt: Date.now() })
        setActiveDinnerTaskId(null)

        if (user && activeChildId) {
          await awardStars({
            userId: user.uid,
            childId: activeChildId,
            delta: task.starValue,
          })
          celebrateSuccess()
        }
      }
    }

    applyBiteAfterCooldown()
  }, [activeChildId, biteCooldownSeconds, pendingDinnerBiteTaskId, tasks, user])

  const activePrincessCooldownIcon = (() => {
    const defaultIcon = getPrincessCooldownIconForHour(new Date().getHours())
    if (biteCooldownTestIconIndex === null) return defaultIcon
    return princessBiteIconCycle[biteCooldownTestIconIndex] ?? defaultIcon
  })()

  const handleCycleCooldownTestIcon = () => {
    if (biteCooldownSeconds <= 0) return
    setBiteCooldownTestIconIndex((prev) => {
      const currentIcon =
        prev === null
          ? activePrincessCooldownIcon
          : (princessBiteIconCycle[prev] ?? activePrincessCooldownIcon)
      const currentIndex = princessBiteIconCycle.indexOf(currentIcon)
      const nextIndex =
        currentIndex >= 0
          ? (currentIndex + 1) % princessBiteIconCycle.length
          : 0
      return nextIndex
    })
  }

  // --- Data Fetching ---
  useEffect(() => {
    if (!user) {
      setTasks([])
      return
    }

    const taskQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
      const newTasks = snapshot.docs.map((docSnapshot) => {
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

      // Initialise title drafts for any new tasks we haven't seen yet
      setTitleDrafts((prev) => {
        const next = { ...prev }
        for (const t of newTasks) {
          if (!(t.id in next)) {
            next[t.id] = t.title
          }
        }
        return next
      })
    })

    return () => {
      unsubscribeTasks()
    }
  }, [user])

  // --- Auto-save helpers ---
  const isEatingTask = (task: TaskRecord) => task.taskType === 'eating'
  const isMathTask = (task: TaskRecord) => task.taskType === 'math'
  const isPositionalNotationTask = (task: TaskRecord) =>
    task.taskType === 'positional-notation'

  const getManageDinnerRemaining = (task: TaskRecord) =>
    task.manageDinnerRemainingSeconds ??
    task.dinnerDurationSeconds ??
    DEFAULT_DINNER_DURATION_SECONDS

  const getManageDinnerBitesLeft = (task: TaskRecord) =>
    task.manageDinnerBitesLeft ?? task.dinnerTotalBites ?? DEFAULT_DINNER_BITES

  const getManageTaskCompletedAt = (task: TaskRecord) => {
    if (isEatingTask(task)) return task.manageDinnerCompletedAt ?? null
    if (isMathTask(task)) return task.manageMathCompletedAt ?? null
    if (isPositionalNotationTask(task)) return task.managePVCompletedAt ?? null
    return task.manageCompletedAt ?? null
  }

  const isManageTaskCompleted = (task: TaskRecord) =>
    Boolean(getManageTaskCompletedAt(task))

  const updateTaskField = async (
    taskId: string,
    field: Partial<
      Pick<
        TaskRecord,
        | 'title'
        | 'schoolDayEnabled'
        | 'nonSchoolDayEnabled'
        | 'starValue'
        | 'isRepeating'
        | 'manageCompletedAt'
        | 'dinnerDurationSeconds'
        | 'dinnerTotalBites'
        | 'manageDinnerRemainingSeconds'
        | 'manageDinnerBitesLeft'
        | 'manageDinnerCompletedAt'
        | 'mathTotalProblems'
        | 'manageMathCompletedAt'
        | 'manageMathLastOutcome'
        | 'pvTotalProblems'
        | 'managePVCompletedAt'
        | 'managePVLastOutcome'
      >
    >
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

  useEffect(() => {
    if (!user || !activeDinnerTaskId) return

    const timer = window.setInterval(async () => {
      const dinnerTask = tasks.find((task) => task.id === activeDinnerTaskId)
      if (!dinnerTask || !isEatingTask(dinnerTask)) {
        setActiveDinnerTaskId(null)
        return
      }

      const remaining = getManageDinnerRemaining(dinnerTask)
      const bitesLeft = getManageDinnerBitesLeft(dinnerTask)
      const isCompleted = Boolean(dinnerTask.manageDinnerCompletedAt)

      if (remaining <= 0 || (bitesLeft <= 0 && isCompleted)) {
        setActiveDinnerTaskId(null)
        return
      }

      if (bitesLeft <= 0 && !isCompleted) {
        return
      }

      const nextRemaining = Math.max(0, remaining - 1)
      await updateTaskField(dinnerTask.id, {
        manageDinnerRemainingSeconds: nextRemaining,
        ...(nextRemaining === 0 ? { manageDinnerCompletedAt: Date.now() } : {}),
      })

      if (nextRemaining === 0) {
        setActiveDinnerTaskId(null)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeDinnerTaskId, tasks, user])

  // Auto-reset manage-page completion state after 15 minutes
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
          updateTaskField(task.id, {
            manageCompletedAt: null,
          })
        }
      }
    }

    checkAndReset()
    const interval = window.setInterval(checkAndReset, 60 * 1000)
    return () => window.clearInterval(interval)
  }, [tasks, user])

  const commitTitle = (taskId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTaskField(taskId, { title: trimmed })
    }
    // If empty, revert draft to last saved value
    const saved = tasks.find((t) => t.id === taskId)
    if (trimmed.length === 0 && saved) {
      setTitleDrafts((prev) => ({ ...prev, [taskId]: saved.title }))
    }
  }

  const renderDayTypeControl = (task: TaskRecord) => {
    const getScheduleButtonStyle = (isActive: boolean) => ({
      background: theme.colors.surface,
      border:
        theme.id === 'space'
          ? `3px solid ${isActive ? theme.colors.secondary : `${theme.colors.secondary}66`}`
          : `4px solid ${isActive ? theme.colors.primary : theme.colors.accent}`,
      boxShadow: isActive
        ? theme.id === 'space'
          ? `0 0 20px ${theme.colors.secondary}55, inset 0 0 20px ${theme.colors.secondary}12`
          : `0 8px 0 ${theme.colors.primary}, 0 0 15px ${theme.colors.primary}22`
        : theme.id === 'space'
          ? `0 0 10px ${theme.colors.secondary}22, inset 0 0 12px ${theme.colors.secondary}10`
          : `0 8px 0 ${theme.colors.accent}, 0 0 8px ${theme.colors.accent}22`,
    })

    return (
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          label="Schoolday"
          icon={null}
          theme={theme}
          color={theme.colors.surface}
          onClick={() =>
            updateTaskField(task.id, {
              schoolDayEnabled: !task.schoolDayEnabled,
            })
          }
          ariaPressed={task.schoolDayEnabled}
          styleOverride={getScheduleButtonStyle(task.schoolDayEnabled)}
          hideArrow
          content={
            <span className="flex h-full w-full items-center justify-center transition-transform group-hover:-translate-y-1">
              {theme.id === 'princess' ? (
                <img
                  src={princessSchoolDayImage}
                  alt="Schoolday"
                  className="h-12 w-full object-contain"
                  style={{ opacity: task.schoolDayEnabled ? 1 : 0.7 }}
                />
              ) : (
                <span
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.heading,
                    fontWeight: 800,
                    opacity: task.schoolDayEnabled ? 1 : 0.7,
                  }}
                >
                  Schoolday
                </span>
              )}
            </span>
          }
        />

        <ActionButton
          label="Non-school day"
          icon={null}
          theme={theme}
          color={theme.colors.surface}
          onClick={() =>
            updateTaskField(task.id, {
              nonSchoolDayEnabled: !task.nonSchoolDayEnabled,
            })
          }
          ariaPressed={task.nonSchoolDayEnabled}
          styleOverride={getScheduleButtonStyle(task.nonSchoolDayEnabled)}
          hideArrow
          content={
            <span className="flex h-full w-full items-center justify-center transition-transform group-hover:-translate-y-1">
              {theme.id === 'princess' ? (
                <img
                  src={princessNonSchoolDayImage}
                  alt="Non-school day"
                  className="h-12 w-full object-contain"
                  style={{ opacity: task.nonSchoolDayEnabled ? 1 : 0.7 }}
                />
              ) : (
                <span
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.heading,
                    fontWeight: 800,
                    opacity: task.nonSchoolDayEnabled ? 1 : 0.7,
                  }}
                >
                  Non-school day
                </span>
              )}
            </span>
          }
        />
      </div>
    )
  }

  // --- Actions ---
  const handleCreateChore = async () => {
    if (!user || !activeChildId) return
    try {
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
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create chore', error)
    }
  }

  const handleCreateEating = async () => {
    if (!user || !activeChildId) return
    try {
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
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create eating dinner chore', error)
    }
  }

  const handleCreateMath = async () => {
    if (!user || !activeChildId) return
    try {
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
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create math chore', error)
    }
  }

  const handleMathComplete = async (task: TaskRecord) => {
    setActiveMathTaskId(null)
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

  const handleMathFail = async (task: TaskRecord) => {
    setActiveMathTaskId(null)
    await updateTaskField(task.id, {
      manageMathCompletedAt: Date.now(),
      manageMathLastOutcome: 'failure',
    })
  }

  const handleMathReset = async (task: TaskRecord) => {
    setActiveMathTaskId(null)
    await updateTaskField(task.id, {
      manageMathCompletedAt: null,
      manageMathLastOutcome: null,
    })
  }

  // --- Positional Notation handlers ---
  const handleCreatePositionalNotation = async () => {
    if (!user || !activeChildId) return
    try {
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
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create positional-notation chore', error)
    }
  }

  const handlePVComplete = async (task: TaskRecord) => {
    setActivePVTaskId(null)
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

  const handlePVFail = async (task: TaskRecord) => {
    setActivePVTaskId(null)
    await updateTaskField(task.id, {
      managePVCompletedAt: Date.now(),
      managePVLastOutcome: 'failure',
    })
  }

  const handlePVReset = async (task: TaskRecord) => {
    setActivePVTaskId(null)
    await updateTaskField(task.id, {
      managePVCompletedAt: null,
      managePVLastOutcome: null,
    })
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
      if (activeDinnerTaskId === id) {
        setActiveDinnerTaskId(null)
      }
      if (activeMathTaskId === id) {
        setActiveMathTaskId(null)
      }
      if (activePVTaskId === id) {
        setActivePVTaskId(null)
      }
      if (pendingDinnerBiteTaskId === id) {
        setPendingDinnerBiteTaskId(null)
      }
      setMathCheckTriggerByTask((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setPVCheckTriggerByTask((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setTitleDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      console.error('Failed to delete chore', error)
    }
  }

  const handleDinnerBite = async (task: TaskRecord) => {
    if (!isEatingTask(task)) return
    if (biteCooldownSeconds > 0) return // still chewing
    if (pendingDinnerBiteTaskId) return
    const bitesLeft = getManageDinnerBitesLeft(task)
    if (bitesLeft <= 0) return

    // Queue bite and run cooldown first; bite is applied when cooldown reaches 0.
    setPendingDinnerBiteTaskId(task.id)
    setBiteCooldownTestIconIndex(null)
    setBiteCooldownSeconds(BITE_COOLDOWN_SECONDS)
  }

  const handleDinnerReset = async (task: TaskRecord) => {
    setBiteCooldownSeconds(0)
    setBiteCooldownTestIconIndex(null)
    setPendingDinnerBiteTaskId(null)
    const totalBites = task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
    const dur = task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    await updateTaskField(task.id, {
      manageDinnerBitesLeft: totalBites,
      manageDinnerRemainingSeconds: dur,
      manageDinnerCompletedAt: null,
    })
  }

  const handleAwardTask = async (task: TaskRecord) => {
    if (!user || !activeChildId) {
      alert('Please select an explorer first.')
      return
    }

    setIsAwarding(true)
    try {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: task.starValue,
      })
      await updateTaskField(task.id, { manageCompletedAt: Date.now() })
      celebrateSuccess()

      if (!task.isRepeating) {
        await deleteDoc(
          doc(collection(db, 'users', user.uid, 'tasks'), task.id)
        )
      }
    } catch (error) {
      console.error('Failed to award stars', error)
      alert('Failed to award stars. Please try again.')
    } finally {
      setIsAwarding(false)
    }
  }

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Chores"
        fontFamily={theme.fonts.heading}
        right={
          <TopIconButton
            theme={theme}
            to="/today"
            ariaLabel="Today"
            icon={
              <img
                src={princessActiveIcon}
                alt="Today"
                className="h-10 w-10 object-contain"
              />
            }
          />
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {!activeChildId ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl">👶</span>
              <p className="text-2xl font-bold">No explorers yet!</p>
            </div>
          ) : (
            <div
              className="flex flex-col"
              style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
            >
              <StandardActionList
                theme={theme}
                items={tasks}
                getKey={(task) => task.id}
                isHighlighted={(task) => isManageTaskCompleted(task)}
                renderItem={(task) =>
                  isEatingTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <DinnerCountdown
                        theme={theme}
                        duration={
                          task.dinnerDurationSeconds ??
                          DEFAULT_DINNER_DURATION_SECONDS
                        }
                        remaining={getManageDinnerRemaining(task)}
                        totalBites={
                          task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                        }
                        bitesLeft={getManageDinnerBitesLeft(task)}
                        starReward={task.starValue}
                        isTimerRunning={activeDinnerTaskId === task.id}
                        plateImage={
                          theme.id === 'princess'
                            ? princessPlateImage
                            : undefined
                        }
                        onAdjustTime={(delta) => {
                          const cur =
                            task.dinnerDurationSeconds ??
                            DEFAULT_DINNER_DURATION_SECONDS
                          const next = Math.max(
                            5 * 60,
                            Math.min(30 * 60, cur + delta)
                          )
                          updateTaskField(task.id, {
                            dinnerDurationSeconds: next,
                            manageDinnerRemainingSeconds: next,
                          })
                        }}
                        onAdjustBites={(delta) => {
                          const cur =
                            task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                          const next = Math.max(1, Math.min(16, cur + delta))
                          updateTaskField(task.id, {
                            dinnerTotalBites: next,
                            manageDinnerBitesLeft: next,
                          })
                        }}
                        onStarsChange={(value) =>
                          updateTaskField(task.id, {
                            starValue: value,
                          })
                        }
                        isCompleted={Boolean(task.manageDinnerCompletedAt)}
                        completionImage={
                          theme.id === 'princess'
                            ? princessEatingFullImage
                            : undefined
                        }
                        failureImage={
                          theme.id === 'princess'
                            ? princessEatingFailImage
                            : undefined
                        }
                        biteCooldownSeconds={biteCooldownSeconds}
                        biteIcon={
                          theme.id === 'princess'
                            ? activePrincessCooldownIcon
                            : undefined
                        }
                        onBiteIconClick={
                          theme.id === 'princess'
                            ? handleCycleCooldownTestIcon
                            : undefined
                        }
                      />
                      {renderDayTypeControl(task)}
                    </div>
                  ) : isMathTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) =>
                          setTitleDrafts((prev) => ({
                            ...prev,
                            [task.id]: value,
                          }))
                        }
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <ArithmeticTester
                        theme={theme}
                        totalProblems={
                          task.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                        }
                        starReward={task.starValue}
                        isRunning={activeMathTaskId === task.id}
                        isCompleted={Boolean(task.manageMathCompletedAt)}
                        isFailed={task.manageMathLastOutcome === 'failure'}
                        onAdjustProblems={(delta) => {
                          const cur =
                            task.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                          const next = Math.max(1, Math.min(10, cur + delta))
                          updateTaskField(task.id, { mathTotalProblems: next })
                        }}
                        onStarsChange={(value) =>
                          updateTaskField(task.id, { starValue: value })
                        }
                        onComplete={() => handleMathComplete(task)}
                        onFail={() => handleMathFail(task)}
                        checkTrigger={mathCheckTriggerByTask[task.id] ?? 0}
                        completionImage={
                          theme.id === 'princess'
                            ? princessMathsCorrectImage
                            : undefined
                        }
                        failureImage={
                          theme.id === 'princess'
                            ? princessMathsIncorrectImage
                            : undefined
                        }
                      />
                      {!task.manageMathCompletedAt &&
                      activeMathTaskId !== task.id
                        ? renderDayTypeControl(task)
                        : null}
                    </div>
                  ) : isPositionalNotationTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) =>
                          setTitleDrafts((prev) => ({
                            ...prev,
                            [task.id]: value,
                          }))
                        }
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <PositionalNotationTester
                        theme={theme}
                        totalProblems={
                          task.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                        }
                        starReward={task.starValue}
                        isRunning={activePVTaskId === task.id}
                        isCompleted={Boolean(task.managePVCompletedAt)}
                        isFailed={task.managePVLastOutcome === 'failure'}
                        onAdjustProblems={(delta: number) => {
                          const cur =
                            task.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                          const next = Math.max(1, Math.min(10, cur + delta))
                          updateTaskField(task.id, { pvTotalProblems: next })
                        }}
                        onStarsChange={(value: number) =>
                          updateTaskField(task.id, { starValue: value })
                        }
                        onComplete={() => handlePVComplete(task)}
                        onFail={() => handlePVFail(task)}
                        checkTrigger={pvCheckTriggerByTask[task.id] ?? 0}
                        completionImage={
                          theme.id === 'princess'
                            ? princessMathsCorrectImage
                            : undefined
                        }
                        failureImage={
                          theme.id === 'princess'
                            ? princessMathsIncorrectImage
                            : undefined
                        }
                      />
                      {!task.managePVCompletedAt && activePVTaskId !== task.id
                        ? renderDayTypeControl(task)
                        : null}
                    </div>
                  ) : (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) =>
                          setTitleDrafts((prev) => ({
                            ...prev,
                            [task.id]: value,
                          }))
                        }
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <StarDisplay
                        theme={theme}
                        count={task.starValue}
                        editable
                        onChange={(nextValue) =>
                          updateTaskField(task.id, {
                            starValue: nextValue || 1,
                          })
                        }
                        min={1}
                        max={3}
                      />

                      <RepeatControl
                        theme={theme}
                        value={task.isRepeating}
                        onChange={(nextValue) =>
                          updateTaskField(task.id, { isRepeating: nextValue })
                        }
                        showLabel={false}
                        showFeedback={false}
                      />

                      {renderDayTypeControl(task)}
                    </div>
                  )
                }
                primaryAction={{
                  label: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      if (isFinished) return 'Again 🔁'
                      return activeDinnerTaskId === task.id ? 'Bite' : 'Start'
                    }
                    if (isMathTask(task)) {
                      if (task.manageMathCompletedAt) return 'Again 🔁'
                      return activeMathTaskId === task.id
                        ? 'Check Answer'
                        : 'Start'
                    }
                    if (isPositionalNotationTask(task)) {
                      if (task.managePVCompletedAt) return 'Again 🔁'
                      return activePVTaskId === task.id
                        ? 'Check Answer'
                        : 'Start'
                    }
                    return task.manageCompletedAt ? 'Done' : 'Give'
                  },
                  icon: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      const isRunning = activeDinnerTaskId === task.id
                      if (!isFinished && !isRunning) {
                        return (
                          <img
                            src={princessGiveStarIcon}
                            alt="Start"
                            className="h-6 w-6 object-contain"
                          />
                        )
                      }
                      if (isRunning) {
                        return (
                          <img
                            src={
                              theme.id === 'princess'
                                ? activePrincessCooldownIcon
                                : princessBiteIcon
                            }
                            alt="Bite"
                            className="h-6 w-6 object-contain"
                          />
                        )
                      }
                      // Finished — show plate icon for "play again"
                      return (
                        <img
                          src={princessPlateImage}
                          alt="Play again"
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    if (isMathTask(task)) {
                      const isFinished = Boolean(task.manageMathCompletedAt)
                      const isRunning =
                        activeMathTaskId === task.id && !isFinished
                      return (
                        <img
                          src={
                            isRunning
                              ? princessMathsIcon
                              : isFinished
                                ? princessMathsIcon
                                : princessGiveStarIcon
                          }
                          alt={
                            isFinished
                              ? 'Play again'
                              : isRunning
                                ? 'Check answer'
                                : 'Start'
                          }
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    if (isPositionalNotationTask(task)) {
                      const isFinished = Boolean(task.managePVCompletedAt)
                      const isRunning =
                        activePVTaskId === task.id && !isFinished
                      return (
                        <img
                          src={
                            isRunning
                              ? princessMathsIcon
                              : isFinished
                                ? princessMathsIcon
                                : princessGiveStarIcon
                          }
                          alt={
                            isFinished
                              ? 'Play again'
                              : isRunning
                                ? 'Check answer'
                                : 'Start'
                          }
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    return (
                      <img
                        src={
                          task.manageCompletedAt
                            ? princessActiveIcon
                            : princessGiveStarIcon
                        }
                        alt={task.manageCompletedAt ? 'Completed' : 'Give star'}
                        className="h-6 w-6 object-contain"
                      />
                    )
                  },
                  onClick: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      if (isFinished) {
                        handleDinnerReset(task)
                        return
                      }
                      if (activeDinnerTaskId === task.id) {
                        handleDinnerBite(task)
                      } else {
                        setActiveDinnerTaskId(task.id)
                      }
                    } else if (isMathTask(task)) {
                      if (task.manageMathCompletedAt) {
                        handleMathReset(task)
                        return
                      }
                      if (activeMathTaskId === task.id) {
                        setMathCheckTriggerByTask((prev) => ({
                          ...prev,
                          [task.id]: (prev[task.id] ?? 0) + 1,
                        }))
                      } else {
                        setActiveMathTaskId(task.id)
                      }
                    } else if (isPositionalNotationTask(task)) {
                      if (task.managePVCompletedAt) {
                        handlePVReset(task)
                        return
                      }
                      if (activePVTaskId === task.id) {
                        setPVCheckTriggerByTask((prev) => ({
                          ...prev,
                          [task.id]: (prev[task.id] ?? 0) + 1,
                        }))
                      } else {
                        setActivePVTaskId(task.id)
                      }
                    } else if (task.manageCompletedAt) {
                      return
                    } else {
                      handleAwardTask(task)
                    }
                  },
                  disabled: (task) => {
                    if (isEatingTask(task)) {
                      // Disable bite button during chewing cooldown
                      if (
                        activeDinnerTaskId === task.id &&
                        biteCooldownSeconds > 0
                      )
                        return true
                      return false
                    }
                    if (isMathTask(task)) {
                      return false
                    }
                    if (isPositionalNotationTask(task)) {
                      return false
                    }
                    return (
                      isAwarding ||
                      !activeChildId ||
                      Boolean(task.manageCompletedAt)
                    )
                  },
                  variant: 'primary',
                  showLabel: () => false,
                }}
                hideEdit
                utilityAction={{
                  label: (task) =>
                    (isMathTask(task) &&
                      activeMathTaskId === task.id &&
                      !task.manageMathCompletedAt) ||
                    (isPositionalNotationTask(task) &&
                      activePVTaskId === task.id &&
                      !task.managePVCompletedAt)
                      ? 'Reset'
                      : 'Delete',
                  ariaLabel: (task) =>
                    isMathTask(task) &&
                    activeMathTaskId === task.id &&
                    !task.manageMathCompletedAt
                      ? 'Reset arithmetic chore'
                      : isPositionalNotationTask(task) &&
                          activePVTaskId === task.id &&
                          !task.managePVCompletedAt
                        ? 'Reset positional notation chore'
                        : 'Delete chore',
                  icon: (task) =>
                    ((isMathTask(task) &&
                      activeMathTaskId === task.id &&
                      !task.manageMathCompletedAt) ||
                      (isPositionalNotationTask(task) &&
                        activePVTaskId === task.id &&
                        !task.managePVCompletedAt)) &&
                    theme.id === 'princess' ? (
                      <img
                        src={princessResetIcon}
                        alt="Reset"
                        className="h-6 w-6 object-contain"
                      />
                    ) : undefined,
                  onClick: (task) => {
                    if (
                      isMathTask(task) &&
                      activeMathTaskId === task.id &&
                      !task.manageMathCompletedAt
                    ) {
                      handleMathReset(task)
                      return
                    }
                    if (
                      isPositionalNotationTask(task) &&
                      activePVTaskId === task.id &&
                      !task.managePVCompletedAt
                    ) {
                      handlePVReset(task)
                      return
                    }
                    handleDelete(task.id)
                  },
                  exits: (task) =>
                    !(
                      (isMathTask(task) &&
                        activeMathTaskId === task.id &&
                        !task.manageMathCompletedAt) ||
                      (isPositionalNotationTask(task) &&
                        activePVTaskId === task.id &&
                        !task.managePVCompletedAt)
                    ),
                  variant: (task) =>
                    (isMathTask(task) &&
                      activeMathTaskId === task.id &&
                      !task.manageMathCompletedAt) ||
                    (isPositionalNotationTask(task) &&
                      activePVTaskId === task.id &&
                      !task.managePVCompletedAt)
                      ? 'neutral'
                      : 'danger',
                }}
                onDelete={(task) => handleDelete(task.id)}
                addLabel="Chore"
                onAdd={() => setShowAddChooser(true)}
                addDisabled={false}
                inlineNewRow={
                  showAddChooser ? (
                    <div
                      className="grid grid-cols-1"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={handleCreateChore}
                        style={{
                          minHeight: `${uiTokens.actionButtonHeight}px`,
                          borderRadius: '20px',
                          border: `3px solid ${theme.colors.accent}`,
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                          color: theme.id === 'space' ? '#000' : '#fff',
                          fontFamily: theme.fonts.heading,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                        }}
                      >
                        Chore
                      </button>

                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={handleCreateEating}
                        style={{
                          minHeight: `${uiTokens.actionButtonHeight}px`,
                          borderRadius: '20px',
                          border: `3px solid ${theme.colors.accent}`,
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                        }}
                      >
                        Eating
                      </button>

                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={handleCreateMath}
                        style={{
                          minHeight: `${uiTokens.actionButtonHeight}px`,
                          borderRadius: '20px',
                          border: `3px solid ${theme.colors.accent}`,
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                        }}
                      >
                        Arithmetic
                      </button>

                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={handleCreatePositionalNotation}
                        style={{
                          minHeight: `${uiTokens.actionButtonHeight}px`,
                          borderRadius: '20px',
                          border: `3px solid ${theme.colors.accent}`,
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                        }}
                      >
                        Place Notation
                      </button>

                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={() => setShowAddChooser(false)}
                        style={{
                          minHeight: '60px',
                          borderRadius: '16px',
                          border: `2px solid ${theme.colors.primary}`,
                          background: 'transparent',
                          color: theme.colors.primary,
                          fontFamily: theme.fonts.body,
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : undefined
                }
                emptyState={
                  <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                    No chores yet.
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default ManageTasksPage
