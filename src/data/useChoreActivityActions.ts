import { completeTaskAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import {
  calculateAwardTaskPatch,
  calculateNextDinnerBiteState,
  calculateWaterToiletStars,
} from '../lib/choreLogic'
import {
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageToiletStatus,
  getManageWaterLevel,
  isEatingTask,
  isWaterToiletTask,
  type TaskEphemeralState,
  type TaskWithEphemeral,
} from './types'
import { manageTestOutcomePatch, resetManageChorePatch } from './dailyTaskState'

type ChoreActivityItem = TaskWithEphemeral

type UseChoreActivityActionsArgs = {
  user: { uid: string } | null
  activeChildId: string | null
  dateKey: string
  updateEphemeral: (
    taskId: string,
    patch: Partial<TaskEphemeralState>
  ) => Promise<void>
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useChoreActivityActions = ({
  user,
  activeChildId,
  dateKey,
  updateEphemeral,
}: UseChoreActivityActionsArgs) => {
  const getCompletionDelta = (item: ChoreActivityItem) => {
    return isWaterToiletTask(item)
      ? calculateWaterToiletStars(
          getManageWaterLevel(item),
          getManageToiletStatus(item)
        )
      : item.starValue
  }

  const applyBite = async (item: ChoreActivityItem) => {
    return applyTaskBite(item)
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

    if (!result.isNowComplete) {
      await updateEphemeral(item.id, {
        manageDinnerBitesLeft: result.nextBites,
      })
      return false
    }

    await delay(850)
    const completionPatch = {
      manageDinnerBitesLeft: result.nextBites,
      manageDinnerCompletedAt: Date.now(),
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: frozenRemaining,
    }
    if (user && activeChildId) {
      await completeTaskAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        taskId: item.id,
        taskCollection: 'chores',
        dateKey,
        delta: item.starValue,
        updates: completionPatch,
        deleteOnComplete: !item.isRepeating,
      })
    } else {
      await updateEphemeral(item.id, completionPatch)
    }
    return true
  }

  const startDinnerTimer = async (item: ChoreActivityItem) => {
    const now = Date.now()
    await updateEphemeral(item.id, { manageDinnerTimerStartedAt: now })
  }

  const expireDinnerTimer = async (item: ChoreActivityItem) => {
    const now = Date.now()
    await updateEphemeral(item.id, {
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: 0,
      manageDinnerCompletedAt: now,
    })
  }

  const resetDinner = async (item: ChoreActivityItem) => {
    return resetTaskDinner(item)
  }

  const resetTaskDinner = (item: TaskWithEphemeral) => {
    if (!isEatingTask(item)) return Promise.resolve()
    return updateEphemeral(item.id, {
      manageDinnerBitesLeft: item.dinnerTotalBites,
      manageDinnerRemainingSeconds: item.dinnerDurationSeconds,
      manageDinnerCompletedAt: null,
      manageDinnerTimerStartedAt: null,
    })
  }

  const completeChore = async (item: ChoreActivityItem) => {
    return completeTaskChore(item)
  }

  const completeTaskChore = async (task: TaskWithEphemeral) => {
    const delta = getCompletionDelta(task)
    const completionPatch = calculateAwardTaskPatch(task, Date.now())
    if (user && activeChildId) {
      const result = await completeTaskAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        taskId: task.id,
        taskCollection: 'chores',
        dateKey,
        delta,
        updates: completionPatch,
        deleteOnComplete: !task.isRepeating,
      })
      if (result.appliedDelta > 0) celebrateSuccess()
    } else {
      await updateEphemeral(task.id, completionPatch)
    }
  }

  const failChore = async (item: ChoreActivityItem) => {
    const now = Date.now()
    await updateEphemeral(
      item.id,
      manageTestOutcomePatch(item.taskType, now, 'failure')
    )
  }

  const resetChore = (item: ChoreActivityItem) =>
    updateEphemeral(item.id, resetManageChorePatch(item.taskType))

  return {
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
  }
}
