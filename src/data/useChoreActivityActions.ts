import { useRef } from 'react'
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
  const dinnerResetVersions = useRef(new Map<string, number>())
  const getCompletionDelta = (item: TaskWithEphemeral) => {
    return isWaterToiletTask(item)
      ? calculateWaterToiletStars(
          getManageWaterLevel(item),
          getManageToiletStatus(item)
        )
      : item.starValue
  }

  const persistCompletion = async (
    item: TaskWithEphemeral,
    updates: Partial<TaskEphemeralState>,
    delta: number
  ) => {
    if (!user || !activeChildId) {
      await updateEphemeral(item.id, updates)
      return 0
    }
    const result = await completeTaskAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      taskId: item.id,
      taskCollection: 'chores',
      dateKey,
      delta,
      updates,
      deleteOnComplete: !item.isRepeating,
    })
    return result.appliedDelta
  }

  const applyBite = async (item: TaskWithEphemeral) => {
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

    const resetVersion = dinnerResetVersions.current.get(item.id)
    await delay(850)
    if (dinnerResetVersions.current.get(item.id) !== resetVersion) return false
    const completionPatch = {
      manageDinnerBitesLeft: result.nextBites,
      manageDinnerCompletedAt: Date.now(),
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: frozenRemaining,
    }
    await persistCompletion(item, completionPatch, item.starValue)
    return true
  }

  const startDinnerTimer = async (item: TaskWithEphemeral) => {
    const now = Date.now()
    await updateEphemeral(item.id, { manageDinnerTimerStartedAt: now })
  }

  const expireDinnerTimer = async (item: TaskWithEphemeral) => {
    const now = Date.now()
    await updateEphemeral(item.id, {
      manageDinnerTimerStartedAt: null,
      manageDinnerRemainingSeconds: 0,
      manageDinnerCompletedAt: now,
    })
  }

  const resetDinner = async (item: TaskWithEphemeral) => {
    if (!isEatingTask(item)) return Promise.resolve()
    dinnerResetVersions.current.set(
      item.id,
      (dinnerResetVersions.current.get(item.id) ?? 0) + 1
    )
    return updateEphemeral(item.id, {
      manageDinnerBitesLeft: item.dinnerTotalBites,
      manageDinnerRemainingSeconds: item.dinnerDurationSeconds,
      manageDinnerCompletedAt: null,
      manageDinnerTimerStartedAt: null,
    })
  }

  const completeChore = async (task: TaskWithEphemeral) => {
    const appliedDelta = await persistCompletion(
      task,
      calculateAwardTaskPatch(task, Date.now()),
      getCompletionDelta(task)
    )
    if (appliedDelta > 0) celebrateSuccess()
  }

  const failChore = async (item: TaskWithEphemeral) => {
    const now = Date.now()
    await updateEphemeral(
      item.id,
      manageTestOutcomePatch(item.taskType, now, 'failure')
    )
  }

  const resetChore = (item: TaskWithEphemeral) =>
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
