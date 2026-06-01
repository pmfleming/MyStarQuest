import { functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { awardStars, completeTodoAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import {
  calculateAwardTaskPatch,
  calculateNextDinnerBiteState,
  calculateWaterToiletStars,
} from '../lib/choreLogic'
import {
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageToiletStatus,
  getManageWaterLevel,
  isEatingTask,
  isEatingTodo,
  isTodoRecord,
  isWaterToiletTask,
  isWaterToiletTodo,
  resetTodayTodosResultSchema,
  type TaskEphemeralState,
  type TaskWithEphemeral,
  type TodoRecord,
  type TodoUpdatableFields,
} from './types'
import {
  manageTestOutcomePatch,
  resetManageChorePatch,
  testTodoOutcomePatch,
} from './dailyTaskState'

type ChoreActivityItem = TaskWithEphemeral | TodoRecord

type UseChoreActivityActionsArgs = {
  user: { uid: string } | null
  activeChildId: string | null
  updateTodoField: (todoId: string, field: TodoUpdatableFields) => Promise<void>
  updateEphemeral: (taskId: string, patch: Partial<TaskEphemeralState>) => void
  deleteTask: (taskId: string) => Promise<void>
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useChoreActivityActions = ({
  user,
  activeChildId,
  updateTodoField,
  updateEphemeral,
  deleteTask,
}: UseChoreActivityActionsArgs) => {
  const getCompletionDelta = (item: ChoreActivityItem) => {
    if (isTodoRecord(item)) {
      return isWaterToiletTodo(item)
        ? calculateWaterToiletStars(item.waterLevel, item.toiletStatus)
        : item.starValue
    }

    return isWaterToiletTask(item)
      ? calculateWaterToiletStars(
          getManageWaterLevel(item),
          getManageToiletStatus(item)
        )
      : item.starValue
  }

  const applyBite = async (item: ChoreActivityItem) => {
    if (isTodoRecord(item)) return applyTodoBite(item)
    return applyTaskBite(item)
  }

  const applyTodoBite = async (item: TodoRecord) => {
    if (!isEatingTodo(item)) return false
    const result = calculateNextDinnerBiteState(
      item.dinnerBitesLeft,
      Boolean(item.completedAt)
    )
    if (!result) return false

    const startedAt = item.dinnerTimerStartedAt
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
    const frozenRemaining = Math.max(0, item.dinnerRemainingSeconds - elapsed)

    await updateTodoField(item.id, { dinnerBitesLeft: result.nextBites })
    if (!result.isNowComplete) return false
    if (!user || !activeChildId) return false

    await delay(850)
    await completeTodoAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      todoId: item.id,
      delta: item.starValue,
      todoCollection: 'choreTodos',
      updates: {
        dinnerTimerStartedAt: null,
        dinnerRemainingSeconds: frozenRemaining,
      },
    })
    return true
  }

  const applyTaskBite = async (item: TaskWithEphemeral) => {
    if (!isEatingTask(item)) return false
    const result = calculateNextDinnerBiteState(
      getManageDinnerBitesLeft(item),
      Boolean(item.manageDinnerCompletedAt)
    )
    if (!result) return false

    const startedAt = item.manageDinnerTimerStartedAt
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
    const frozenRemaining = Math.max(
      0,
      getManageDinnerRemaining(item) - elapsed
    )

    updateEphemeral(item.id, { manageDinnerBitesLeft: result.nextBites })
    if (!result.isNowComplete) return false

    await delay(850)
    updateEphemeral(item.id, {
      manageDinnerCompletedAt: Date.now(),
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: frozenRemaining,
    })
    if (user && activeChildId) {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: item.starValue,
      })
    }
    return true
  }

  const startDinnerTimer = async (item: ChoreActivityItem) => {
    const now = Date.now()
    if (isTodoRecord(item)) {
      await updateTodoField(item.id, { dinnerTimerStartedAt: now })
    } else {
      updateEphemeral(item.id, { manageDinnerTimerStartedAt: now })
    }
  }

  const expireDinnerTimer = async (item: ChoreActivityItem) => {
    const now = Date.now()
    if (isTodoRecord(item)) {
      await updateTodoField(item.id, {
        dinnerTimerStartedAt: null,
        dinnerRemainingSeconds: 0,
        completedAt: now,
      })
    } else {
      updateEphemeral(item.id, {
        manageDinnerTimerStartedAt: null,
        manageDinnerRemainingSeconds: 0,
        manageDinnerCompletedAt: now,
      })
    }
  }

  const resetDinner = async (item: ChoreActivityItem) => {
    if (isTodoRecord(item)) return resetTodoDinner(item)
    return resetTaskDinner(item)
  }

  const resetTodoDinner = async (item: TodoRecord) => {
    if (!isEatingTodo(item)) return
    await updateTodoField(item.id, {
      dinnerTimerStartedAt: null,
      dinnerRemainingSeconds: item.dinnerDurationSeconds,
      dinnerBitesLeft: item.dinnerTotalBites,
      completedAt: null,
    })
  }

  const resetTaskDinner = (item: TaskWithEphemeral) => {
    if (!isEatingTask(item)) return
    updateEphemeral(item.id, {
      manageDinnerBitesLeft: item.dinnerTotalBites,
      manageDinnerRemainingSeconds: item.dinnerDurationSeconds,
      manageDinnerCompletedAt: null,
      manageDinnerTimerStartedAt: null,
    })
  }

  const completeChore = async (item: ChoreActivityItem) => {
    if (isTodoRecord(item)) return completeTodoChore(item)
    return completeTaskChore(item)
  }

  const completeTodoChore = async (todo: TodoRecord) => {
    if (!user || !activeChildId) return
    if (todo.completedAt) return
    const delta = getCompletionDelta(todo)
    const done = await completeTodoAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      todoId: todo.id,
      delta,
      todoCollection: 'choreTodos',
    })
    if (done && delta > 0) celebrateSuccess()
  }

  const completeTaskChore = async (task: TaskWithEphemeral) => {
    const delta = getCompletionDelta(task)
    updateEphemeral(task.id, calculateAwardTaskPatch(task, Date.now()))
    if (user && activeChildId) {
      await awardStars({ userId: user.uid, childId: activeChildId, delta })
      if (delta > 0) celebrateSuccess()
    }
    if (!task.isRepeating) await deleteTask(task.id)
  }

  const failChore = async (item: ChoreActivityItem) => {
    const now = Date.now()
    if (isTodoRecord(item)) {
      await updateTodoField(
        item.id,
        testTodoOutcomePatch(item.sourceTaskType, now, 'failure')
      )
    } else {
      updateEphemeral(
        item.id,
        manageTestOutcomePatch(item.taskType, now, 'failure')
      )
    }
  }

  const resetChore = async (item: ChoreActivityItem) => {
    if (isTodoRecord(item)) {
      await updateTodoField(item.id, getTodoResetPatch(item))
    } else {
      updateEphemeral(item.id, resetManageChorePatch(item.taskType))
    }
  }

  const resetTodayChores = async () => {
    if (!user || !activeChildId) return
    const callable = httpsCallable(functions, 'resetTodayChores')
    const result = await callable({ childId: activeChildId })
    resetTodayTodosResultSchema.parse(result)
  }

  return {
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
    resetTodayChores,
  }
}

const getTodoResetPatch = (item: TodoRecord): TodoUpdatableFields =>
  isWaterToiletTodo(item)
    ? {
        completedAt: null,
        waterLevel: DEFAULT_WATER_LEVEL,
        toiletStatus: DEFAULT_TOILET_STATUS,
      }
    : testTodoOutcomePatch(item.sourceTaskType, null, null)
