import { useEffect, useState, useRef } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import DinnerCountdown, {
  BITE_COOLDOWN_SECONDS,
} from '../components/DinnerCountdown'
import ArithmeticTester from '../components/ArithmeticTester'
import PositionalNotationTester from '../components/PositionalNotationTaskTester'
import {
  CURRENT_DAY_LABELS,
  getScheduleLabel,
  getTodayDescriptor,
} from '../utils/today'
import { uiTokens } from '../ui/tokens'
import { useTodos } from '../data/useTodos'
import {
  isEatingTodo,
  isMathTodo,
  isPositionalNotationTodo,
  type EatingTodo,
  type MathTodo,
  type PositionalNotationTodo,
  type TodoRecord,
} from '../data/types'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessChoresIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessHomeIcon,
  princessResetIcon,
  princessMathsCorrectImage,
  princessMathsIcon,
  princessMathsIncorrectImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessPlateImage,
  princessSchoolDayImage,
} from '../assets/themes/princess/assets'

const getPrincessNonSchoolDayImage = (
  season: ReturnType<typeof getTodayDescriptor>['season']
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

const TodayPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()

  // 1. DATA PIPELINE FIX: Call getTodayDescriptor directly to guarantee todayInfo exists.
  const todayInfo = getTodayDescriptor()

  // Ensure your hook uses activeChildId and todayInfo.dateKey internally for its Firestore query!
  const {
    todos,
    availableChores,
    completedCount,
    todoSourceIds,
    getDinnerDuration,
    getDinnerLiveRemaining,
    getDinnerTotalBites,
    getDinnerBitesLeft,
    getMathTotalProblems,
    getPVTotalProblems,
    addTodo,
    completeTodo,
    deleteTodo,
    dinnerApplyBite,
    dinnerStartTimer,
    dinnerTimerExpired,
    mathComplete,
    mathFail,
    pvComplete,
    pvFail,
    resetTodayTodos,
  } = useTodos()

  const [showAddChooser, setShowAddChooser] = useState(false)
  const [, setDinnerTimerTick] = useState(0)
  const [pendingTodoId, setPendingTodoId] = useState<string | null>(null)
  
  // Active UI States
  const [activeDinnerTodoId, setActiveDinnerTodoId] = useState<string | null>(null)
  const [activeMathTodoId, setActiveMathTodoId] = useState<string | null>(null)
  const [activePVTodoId, setActivePVTodoId] = useState<string | null>(null)
  
  const [mathCheckTriggerByTodo, setMathCheckTriggerByTodo] = useState<Record<string, number>>({})
  const [pvCheckTriggerByTodo, setPVCheckTriggerByTodo] = useState<Record<string, number>>({})
  const [biteCooldownSeconds, setBiteCooldownSeconds] = useState(0)
  const [pendingDinnerBiteTodoId, setPendingDinnerBiteTodoId] = useState<string | null>(null)

  // 2. MEMORY & REACTIVITY FIX: Keep a mutable ref of the latest todos so intervals don't reset.
  const todosRef = useRef(todos)
  useEffect(() => {
    todosRef.current = todos
  }, [todos])

  // Track mount status to prevent setting state on unmounted components
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const princessNonSchoolDayImage = getPrincessNonSchoolDayImage(todayInfo.season)

  // Reset UI state on child/date change
  useEffect(() => {
    setActiveDinnerTodoId(null)
    setActiveMathTodoId(null)
    setActivePVTodoId(null)
    setMathCheckTriggerByTodo({})
    setPVCheckTriggerByTodo({})
    setBiteCooldownSeconds(0)
    setPendingDinnerBiteTodoId(null)
  }, [activeChildId, todayInfo.dateKey])

  // Bite Cooldown Timer
  useEffect(() => {
    if (biteCooldownSeconds <= 0) return
    const timer = window.setTimeout(() => {
      if (isMounted.current) {
        setBiteCooldownSeconds((prev) => Math.max(0, prev - 1))
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [biteCooldownSeconds])

  // Clear cooldown early if no active bite is pending
  useEffect(() => {
    if (!activeDinnerTodoId && !pendingDinnerBiteTodoId) {
      setBiteCooldownSeconds(0)
    }
  }, [activeDinnerTodoId, pendingDinnerBiteTodoId])

  // Apply bite only after cooldown completes
  useEffect(() => {
    if (!pendingDinnerBiteTodoId || biteCooldownSeconds > 0) return

    const applyBiteAfterCooldown = async () => {
      // Use todosRef instead of todos dependency to avoid race conditions during syncs
      const todo = todosRef.current.find((item) => item.id === pendingDinnerBiteTodoId)
      
      if (isMounted.current) setPendingDinnerBiteTodoId(null)

      if (!todo || !isEatingTodo(todo) || todo.completedAt) return

      try {
        const done = await dinnerApplyBite(todo)
        if (done && isMounted.current) setActiveDinnerTodoId(null)
      } catch (error) {
        console.error('Failed to apply bite', error)
      }
    }

    applyBiteAfterCooldown()
  }, [biteCooldownSeconds, dinnerApplyBite, pendingDinnerBiteTodoId])

  // Dinner timer: tick each second while active (client-side only, no Firestore writes)
  useEffect(() => {
    if (!activeDinnerTodoId) return

    const timer = window.setInterval(() => {
      // Use todosRef so we don't have to put 'todos' in the dependency array
      const todo = todosRef.current.find((item) => item.id === activeDinnerTodoId)
      
      if (!todo || !isEatingTodo(todo) || todo.completedAt) {
        setActiveDinnerTodoId(null)
        return
      }

      const remaining = getDinnerLiveRemaining(todo)
      const bitesLeft = getDinnerBitesLeft(todo)

      if (remaining <= 0) {
        dinnerTimerExpired(todo)
        setActiveDinnerTodoId(null)
        return
      }

      if (bitesLeft <= 0) {
        setActiveDinnerTodoId(null)
        return
      }

      // Force re-render to update displayed remaining time
      if (isMounted.current) setDinnerTimerTick((t) => t + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeDinnerTodoId, dinnerTimerExpired, getDinnerBitesLeft, getDinnerLiveRemaining])

  // --- Slim handler wrappers ---
  const handleAddTodo = async (task: { id: string }) => {
    if (todoSourceIds.has(task.id)) return
    await addTodo(task as Parameters<typeof addTodo>[0])
    setShowAddChooser(false)
  }

  const handleCompleteTodo = async (todo: TodoRecord) => {
    if (todo.completedAt || pendingTodoId) return

    setPendingTodoId(todo.id)
    try {
      await completeTodo(todo)
    } catch (error) {
      console.error('Failed to complete todo', error)
      alert('Failed to complete that todo. Please try again.')
    } finally {
      if (isMounted.current) setPendingTodoId(null)
    }
  }

  const handleDeleteTodo = async (todo: TodoRecord) => {
    if (activeDinnerTodoId === todo.id) setActiveDinnerTodoId(null)
    if (activeMathTodoId === todo.id) setActiveMathTodoId(null)
    if (activePVTodoId === todo.id) setActivePVTodoId(null)
    if (pendingDinnerBiteTodoId === todo.id) setPendingDinnerBiteTodoId(null)
    await deleteTodo(todo)
  }

  const handleDinnerBite = (todo: EatingTodo) => {
    if (todo.completedAt) return
    if (biteCooldownSeconds > 0 || pendingDinnerBiteTodoId) return

    const bitesLeft = getDinnerBitesLeft(todo)
    if (bitesLeft <= 0) return

    setPendingDinnerBiteTodoId(todo.id)
    setBiteCooldownSeconds(BITE_COOLDOWN_SECONDS)
  }

  const handleMathComplete = async (todo: MathTodo) => {
    setActiveMathTodoId(null)
    await mathComplete(todo)
  }

  const handleMathFail = async (todo: MathTodo) => {
    setActiveMathTodoId(null)
    await mathFail(todo)
  }

  const handlePVComplete = async (todo: PositionalNotationTodo) => {
    setActivePVTodoId(null)
    await pvComplete(todo)
  }

  const handlePVFail = async (todo: PositionalNotationTodo) => {
    setActivePVTodoId(null)
    await pvFail(todo)
  }

  const summaryText =
    todos.length === 0
      ? 'No todos planned for today yet.'
      : `${completedCount} of ${todos.length} completed.`

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Today"
        fontFamily={theme.fonts.heading}
        right={
          <>
            <TopIconButton
              theme={theme}
              onClick={() => {
                  if (activeChildId) resetTodayTodos()
              }}
              ariaLabel="Reset today"
              icon={
                theme.id === 'princess' ? (
                  <img src={princessResetIcon} alt="Reset today" className="h-10 w-10 object-contain" />
                ) : (
                  <span className="text-2xl" role="img" aria-hidden="true">🔄</span>
                )
              }
            />
            <TopIconButton
              theme={theme}
              to="/settings/manage-tasks"
              ariaLabel="Chores"
              icon={
                theme.id === 'princess' ? (
                  <img src={princessChoresIcon} alt="Chores" className="h-10 w-10 object-contain" />
                ) : (
                  <span className="text-2xl" role="img" aria-hidden="true">🧹</span>
                )
              }
            />
            <TopIconButton
              theme={theme}
              to="/"
              ariaLabel="Home"
              icon={
                theme.id === 'princess' ? (
                  <img src={princessHomeIcon} alt="Home" className="h-10 w-10 object-contain" />
                ) : (
                  <span className="text-2xl" role="img" aria-hidden="true">🏠</span>
                )
              }
            />
          </>
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto flex w-full flex-col"
          style={{
            maxWidth: `${uiTokens.contentMaxWidth}px`,
            gap: `${uiTokens.singleVerticalSpace}px`,
          }}
        >
          <section
            style={{
              borderRadius: '28px',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              color: theme.id === 'space' ? '#000' : '#fff',
              padding: '24px',
              boxShadow: `0 10px 30px ${theme.colors.primary}33`,
            }}
          >
            <div className="text-sm font-bold tracking-[0.2em] uppercase opacity-80">
              {CURRENT_DAY_LABELS[todayInfo.dayType]}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: '1.9rem',
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: '8px',
              }}
            >
              {todayInfo.dayName}
            </div>
            <div className="mt-2 text-lg font-semibold">{todayInfo.formattedDate}</div>
            <div className="mt-4 text-base font-semibold opacity-90">{summaryText}</div>
          </section>

          {!activeChildId ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl" role="img" aria-label="Child">👶</span>
              <p className="text-2xl font-bold">Pick a child before planning today.</p>
            </div>
          ) : (
            <StandardActionList
              theme={theme}
              items={todos}
              getKey={(todo) => todo.id}
              getStarCount={(todo) => todo.starValue}
              isHighlighted={(todo) => Boolean(todo.completedAt)}
              renderItem={(todo) => (
                <div className="flex flex-col" style={{ gap: `${Math.max(12, uiTokens.singleVerticalSpace / 2)}px` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2 }}>
                      {todo.title}
                    </div>

                    <div className="flex items-center gap-3">
                      {todo.schoolDayEnabled && (
                        <div
                          style={{
                            width: '60px', height: '60px', minWidth: '60px',
                            borderRadius: '20px', border: `2px solid ${theme.colors.primary}`,
                            background: theme.colors.surface, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '8px',
                          }}
                        >
                          {theme.id === 'princess' ? (
                            <img src={princessSchoolDayImage} alt="Schoolday" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-2xl" role="img" aria-label="Schoolday">🏫</span>
                          )}
                        </div>
                      )}

                      {todo.nonSchoolDayEnabled && (
                        <div
                          style={{
                            width: '60px', height: '60px', minWidth: '60px',
                            borderRadius: '20px', border: `2px solid ${theme.colors.primary}`,
                            background: theme.colors.surface, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '8px',
                          }}
                        >
                          {theme.id === 'princess' ? (
                            <img src={princessNonSchoolDayImage} alt="Non-school day" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-2xl" role="img" aria-label="Non-school day">🌤️</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEatingTodo(todo) && (activeDinnerTodoId === todo.id || Boolean(todo.completedAt)) ? (
                    <DinnerCountdown
                      theme={theme}
                      duration={getDinnerDuration(todo)}
                      remaining={getDinnerLiveRemaining(todo)}
                      totalBites={getDinnerTotalBites(todo)}
                      bitesLeft={getDinnerBitesLeft(todo)}
                      starReward={todo.starValue}
                      isTimerRunning={activeDinnerTodoId === todo.id}
                      plateImage={theme.id === 'princess' ? princessPlateImage : undefined}
                      onAdjustTime={() => undefined}
                      onAdjustBites={() => undefined}
                      onStarsChange={() => undefined}
                      isCompleted={Boolean(todo.completedAt)}
                      completionImage={theme.id === 'princess' ? princessEatingFullImage : undefined}
                      failureImage={theme.id === 'princess' ? princessEatingFailImage : undefined}
                      biteCooldownSeconds={biteCooldownSeconds}
                      biteIcon={theme.id === 'princess' ? princessBiteIcon : undefined}
                    />
                  ) : null}

                  {isMathTodo(todo) && (activeMathTodoId === todo.id || Boolean(todo.completedAt)) ? (
                    <ArithmeticTester
                      theme={theme}
                      totalProblems={getMathTotalProblems(todo)}
                      starReward={todo.starValue}
                      isRunning={activeMathTodoId === todo.id}
                      isCompleted={Boolean(todo.completedAt)}
                      isFailed={todo.mathLastOutcome === 'failure'}
                      onAdjustProblems={() => undefined}
                      onStarsChange={() => undefined}
                      onComplete={() => handleMathComplete(todo)}
                      onFail={() => handleMathFail(todo)}
                      checkTrigger={mathCheckTriggerByTodo[todo.id] ?? 0}
                      completionImage={theme.id === 'princess' ? princessMathsCorrectImage : undefined}
                      failureImage={theme.id === 'princess' ? princessMathsIncorrectImage : undefined}
                    />
                  ) : null}

                  {isPositionalNotationTodo(todo) && (activePVTodoId === todo.id || Boolean(todo.completedAt)) ? (
                    <PositionalNotationTester
                      theme={theme}
                      totalProblems={getPVTotalProblems(todo)}
                      starReward={todo.starValue}
                      isRunning={activePVTodoId === todo.id}
                      isCompleted={Boolean(todo.completedAt)}
                      isFailed={todo.pvLastOutcome === 'failure'}
                      onAdjustProblems={() => undefined}
                      onStarsChange={() => undefined}
                      onComplete={() => handlePVComplete(todo)}
                      onFail={() => handlePVFail(todo)}
                      checkTrigger={pvCheckTriggerByTodo[todo.id] ?? 0}
                      completionImage={theme.id === 'princess' ? princessMathsCorrectImage : undefined}
                      failureImage={theme.id === 'princess' ? princessMathsIncorrectImage : undefined}
                    />
                  ) : null}
                </div>
              )}
              primaryAction={{
                label: () => 'Open chore',
                icon: (todo) => {
                  // 3. A11y FIX: Added proper ARIA labeling to emoji fallbacks
                  if (theme.id !== 'princess') {
                    if (todo.completedAt) return <span role="img" aria-label="Completed">✅</span>
                    if (isEatingTodo(todo)) return <span role="img" aria-label="Eating task">🍽️</span>
                    if (isMathTodo(todo) || isPositionalNotationTodo(todo)) {
                      return <span role="img" aria-label="Math task">🔢</span>
                    }
                    return <span role="img" aria-label="Standard task">⭐</span>
                  }

                  const iconSrc = todo.completedAt
                    ? princessActiveIcon
                    : isEatingTodo(todo)
                      ? princessBiteIcon
                      : isMathTodo(todo) || isPositionalNotationTodo(todo)
                        ? princessMathsIcon
                        : princessGiveStarIcon

                  return (
                    <img
                      src={iconSrc}
                      alt={todo.completedAt ? 'Completed' : 'Open chore'}
                      className="h-6 w-6 object-contain"
                    />
                  )
                },
                onClick: (todo) => {
                  if (isEatingTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveMathTodoId(null)
                    setActivePVTodoId(null)
                    if (activeDinnerTodoId === todo.id) {
                      handleDinnerBite(todo)
                    } else {
                      dinnerStartTimer(todo)
                      setActiveDinnerTodoId(todo.id)
                    }
                    return
                  }

                  if (isMathTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveDinnerTodoId(null)
                    setActivePVTodoId(null)
                    if (activeMathTodoId === todo.id) {
                      setMathCheckTriggerByTodo((prev) => ({
                        ...prev,
                        [todo.id]: (prev[todo.id] ?? 0) + 1,
                      }))
                    } else {
                      setActiveMathTodoId(todo.id)
                    }
                    return
                  }

                  if (isPositionalNotationTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveDinnerTodoId(null)
                    setActiveMathTodoId(null)
                    if (activePVTodoId === todo.id) {
                      setPVCheckTriggerByTodo((prev) => ({
                        ...prev,
                        [todo.id]: (prev[todo.id] ?? 0) + 1,
                      }))
                    } else {
                      setActivePVTodoId(todo.id)
                    }
                    return
                  }

                  handleCompleteTodo(todo)
                },
                disabled: (todo) => {
                  if (todo.completedAt) return true
                  if (isEatingTodo(todo)) {
                    return (
                      pendingTodoId === todo.id ||
                      (activeDinnerTodoId === todo.id && biteCooldownSeconds > 0)
                    )
                  }
                  if (isMathTodo(todo) || isPositionalNotationTodo(todo)) {
                    return false
                  }
                  return pendingTodoId === todo.id
                },
                variant: 'primary',
                showLabel: () => false,
              }}
              hideEdit
              onDelete={(todo) => handleDeleteTodo(todo)}
              addLabel="Add Todo"
              onAdd={() => setShowAddChooser(true)}
              inlineNewRow={
                showAddChooser ? (
                  <div className="grid grid-cols-1" style={{ gap: `${uiTokens.singleVerticalSpace}px` }}>
                    {availableChores.length === 0 ? (
                      <div
                        className="rounded-3xl text-center"
                        style={{
                          border: `2px dashed ${theme.colors.primary}`,
                          padding: '20px',
                          fontWeight: 700,
                        }}
                      >
                        No more chores are available to add today.
                      </div>
                    ) : (
                      availableChores.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className="whimsical-btn text-left"
                          onClick={() => handleAddTodo(task)}
                          style={{
                            minHeight: `${uiTokens.actionButtonHeight}px`,
                            borderRadius: '20px',
                            border: `3px solid ${theme.colors.accent}`,
                            background: theme.colors.surface,
                            color: theme.colors.text,
                            fontFamily: theme.fonts.heading,
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <span>{task.title}</span>
                          <span className="text-sm opacity-75">
                            {getScheduleLabel(task)} • {task.starValue} {task.starValue === 1 ? 'star' : 'stars'}
                          </span>
                        </button>
                      ))
                    )}

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
                  No todos for today yet.
                </div>
              }
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default TodayPage