import { awardStars } from '../lib/starActions'
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
  updateEphemeral: (taskId: string, patch: Partial<TaskEphemeralState>) => void
  deleteTask: (taskId: string) => Promise<void>
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useChoreActivityActions = ({
  user,
  activeChildId,
  updateEphemeral,
  deleteTask,
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
    updateEphemeral(item.id, { manageDinnerTimerStartedAt: now })
  }

  const expireDinnerTimer = async (item: ChoreActivityItem) => {
    const now = Date.now()
    updateEphemeral(item.id, {
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: 0,
      manageDinnerCompletedAt: now,
    })
  }

  const resetDinner = async (item: ChoreActivityItem) => {
    return resetTaskDinner(item)
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
    return completeTaskChore(item)
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
    updateEphemeral(
      item.id,
      manageTestOutcomePatch(item.taskType, now, 'failure')
    )
  }

  const resetChore = async (item: ChoreActivityItem) => {
    updateEphemeral(item.id, resetManageChorePatch(item.taskType))
  }

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
