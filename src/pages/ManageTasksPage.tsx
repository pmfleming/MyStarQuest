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
import StandardActionList from '../components/StandardActionList'
import StarDisplay from '../components/StarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import DinnerCountdown, {
  BITE_COOLDOWN_SECONDS,
} from '../components/DinnerCountdown'
import { uiTokens } from '../ui/tokens'
import {
  princessBiteIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessHomeIcon,
  princessPlateImage,
} from '../assets/themes/princess/assets'

// --- Types ---
type TaskRecord = {
  id: string
  title: string
  childId: string
  category: string
  taskType: 'standard' | 'eating'
  starValue: number
  isRepeating: boolean
  dinnerDurationSeconds?: number
  dinnerRemainingSeconds?: number
  dinnerTotalBites?: number
  dinnerBitesLeft?: number
  dinnerCompletedAt?: number | null
  createdAt?: Date
}

const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
const DEFAULT_DINNER_BITES = 2
const DEFAULT_DINNER_STARS = 3

const ManageTasksPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isAwarding, setIsAwarding] = useState(false)
  const [activeDinnerTaskId, setActiveDinnerTaskId] = useState<string | null>(
    null
  )
  const [showAddChooser, setShowAddChooser] = useState(false)

  // Bite cooldown: prevents rapid tapping (one bite per 20 s)
  const [biteCooldownSeconds, setBiteCooldownSeconds] = useState(0)

  // Local title state keyed by task id, used for controlled inputs
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

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
    if (!activeDinnerTaskId) {
      setBiteCooldownSeconds(0)
    }
  }, [activeDinnerTaskId])

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
          data.taskType === 'eating' || data.category === 'eating'
            ? 'eating'
            : 'standard'
        return {
          id: docSnapshot.id,
          title: data.title ?? '',
          childId: data.childId ?? '',
          category: data.category ?? '',
          taskType,
          starValue: Number(data.starValue ?? 1),
          isRepeating: data.isRepeating ?? false,
          dinnerDurationSeconds:
            data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
          dinnerRemainingSeconds:
            data.dinnerRemainingSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
          dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
          dinnerBitesLeft: data.dinnerBitesLeft ?? DEFAULT_DINNER_BITES,
          dinnerCompletedAt: data.dinnerCompletedAt ?? null,
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

  const updateTaskField = async (
    taskId: string,
    field: Partial<
      Pick<
        TaskRecord,
        | 'title'
        | 'starValue'
        | 'isRepeating'
        | 'dinnerDurationSeconds'
        | 'dinnerRemainingSeconds'
        | 'dinnerTotalBites'
        | 'dinnerBitesLeft'
        | 'dinnerCompletedAt'
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

      const remaining = dinnerTask.dinnerRemainingSeconds ?? 0
      const bitesLeft = dinnerTask.dinnerBitesLeft ?? 0

      if (remaining <= 0 || bitesLeft <= 0) {
        setActiveDinnerTaskId(null)
        return
      }

      const nextRemaining = Math.max(0, remaining - 1)
      await updateTaskField(dinnerTask.id, {
        dinnerRemainingSeconds: nextRemaining,
        ...(nextRemaining === 0 ? { dinnerCompletedAt: Date.now() } : {}),
      })

      if (nextRemaining === 0) {
        setActiveDinnerTaskId(null)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeDinnerTaskId, tasks, user])

  // Auto-reset eating tasks 1 hour after completion
  useEffect(() => {
    if (!user) return
    const AUTO_RESET_MS = 60 * 60 * 1000

    const checkAndReset = () => {
      const now = Date.now()
      for (const task of tasks) {
        if (
          isEatingTask(task) &&
          task.dinnerCompletedAt &&
          now - task.dinnerCompletedAt >= AUTO_RESET_MS
        ) {
          const totalBites = task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
          const dur =
            task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
          updateTaskField(task.id, {
            dinnerBitesLeft: totalBites,
            dinnerRemainingSeconds: dur,
            dinnerCompletedAt: null,
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

  // --- Actions ---
  const handleCreateChore = async () => {
    if (!user || !activeChildId) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title: '',
        childId: activeChildId,
        category: '',
        taskType: 'standard',
        starValue: 1,
        isRepeating: true,
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
        starValue: DEFAULT_DINNER_STARS,
        isRepeating: true,
        dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
        dinnerRemainingSeconds: DEFAULT_DINNER_DURATION_SECONDS,
        dinnerTotalBites: DEFAULT_DINNER_BITES,
        dinnerBitesLeft: DEFAULT_DINNER_BITES,
        createdAt: serverTimestamp(),
      })
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create eating dinner chore', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
      if (activeDinnerTaskId === id) {
        setActiveDinnerTaskId(null)
      }
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
    const bitesLeft = task.dinnerBitesLeft ?? 0
    if (bitesLeft <= 0) return

    const nextBites = Math.max(0, bitesLeft - 1)
    await updateTaskField(task.id, { dinnerBitesLeft: nextBites })

    // Start cooldown only if more bites remain
    if (nextBites > 0) {
      setBiteCooldownSeconds(BITE_COOLDOWN_SECONDS)
    }

    if (nextBites === 0) {
      setActiveDinnerTaskId(null)
      // Award stars and celebrate on successful completion
      if (user && activeChildId) {
        await awardStars({
          userId: user.uid,
          childId: activeChildId,
          delta: task.starValue,
        })
        celebrateSuccess()
      }
      await updateTaskField(task.id, { dinnerCompletedAt: Date.now() })
    }
  }

  const handleDinnerReset = async (task: TaskRecord) => {
    setBiteCooldownSeconds(0)
    const totalBites = task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
    const dur = task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS
    await updateTaskField(task.id, {
      dinnerBitesLeft: totalBites,
      dinnerRemainingSeconds: dur,
      dinnerCompletedAt: null,
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
            to="/"
            ariaLabel="Home"
            icon={
              <img
                src={princessHomeIcon}
                alt="Home"
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
                renderItem={(task) =>
                  isEatingTask(task) ? (
                    <DinnerCountdown
                      theme={theme}
                      duration={
                        task.dinnerDurationSeconds ??
                        DEFAULT_DINNER_DURATION_SECONDS
                      }
                      remaining={
                        task.dinnerRemainingSeconds ??
                        task.dinnerDurationSeconds ??
                        DEFAULT_DINNER_DURATION_SECONDS
                      }
                      totalBites={task.dinnerTotalBites ?? DEFAULT_DINNER_BITES}
                      bitesLeft={
                        task.dinnerBitesLeft ??
                        task.dinnerTotalBites ??
                        DEFAULT_DINNER_BITES
                      }
                      starReward={task.starValue}
                      isTimerRunning={activeDinnerTaskId === task.id}
                      plateImage={
                        theme.id === 'princess' ? princessPlateImage : undefined
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
                          dinnerRemainingSeconds: next,
                        })
                      }}
                      onAdjustBites={(delta) => {
                        const cur =
                          task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                        const next = Math.max(1, Math.min(16, cur + delta))
                        updateTaskField(task.id, {
                          dinnerTotalBites: next,
                          dinnerBitesLeft: next,
                        })
                      }}
                      onStarsChange={(value) =>
                        updateTaskField(task.id, {
                          starValue: value,
                        })
                      }
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
                        theme.id === 'princess' ? princessBiteIcon : undefined
                      }
                    />
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
                    </div>
                  )
                }
                primaryAction={{
                  label: (task) => {
                    if (isEatingTask(task)) {
                      const bitesLeft = task.dinnerBitesLeft ?? 1
                      const remaining = task.dinnerRemainingSeconds ?? 1
                      const isFinished = bitesLeft <= 0 || remaining <= 0
                      if (isFinished) return 'Again 🔁'
                      return activeDinnerTaskId === task.id ? 'Bite' : 'Start'
                    }
                    return 'Give'
                  },
                  icon: (task) => {
                    if (isEatingTask(task)) {
                      const bitesLeft = task.dinnerBitesLeft ?? 1
                      const remaining = task.dinnerRemainingSeconds ?? 1
                      const isFinished = bitesLeft <= 0 || remaining <= 0
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
                            src={princessBiteIcon}
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
                    return (
                      <img
                        src={princessGiveStarIcon}
                        alt="Give star"
                        className="h-6 w-6 object-contain"
                      />
                    )
                  },
                  onClick: (task) => {
                    if (isEatingTask(task)) {
                      const bitesLeft = task.dinnerBitesLeft ?? 1
                      const remaining = task.dinnerRemainingSeconds ?? 1
                      const isFinished = bitesLeft <= 0 || remaining <= 0
                      if (isFinished) {
                        handleDinnerReset(task)
                        return
                      }
                      if (activeDinnerTaskId === task.id) {
                        handleDinnerBite(task)
                      } else {
                        setActiveDinnerTaskId(task.id)
                      }
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
                    return isAwarding || !activeChildId
                  },
                  variant: 'primary',
                  showLabel: () => false,
                }}
                hideEdit
                onDelete={(task) => handleDelete(task.id)}
                addLabel="Add Chore"
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
                        Add Chore
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
                        Add Eating
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
