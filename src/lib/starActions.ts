import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isOfflineEnabled } from '../offline/platform'

type TaskCollection = 'chores' | 'tests'

const hasCompletedAttempt = (
  task: Record<string, unknown>,
  taskCollection: TaskCollection,
  dateKey: string
) => {
  if (taskCollection === 'tests') {
    return task.lastAttemptedAt != null && task.lastAttemptDateKey === dateKey
  }
  const taskType = task.taskType ?? task.choreType ?? task.category
  const completedAt =
    taskType === 'eating'
      ? task.manageDinnerCompletedAt
      : taskType === 'watertoiletcheck'
        ? task.manageWaterToiletCompletedAt
        : task.manageCompletedAt
  return completedAt != null
}

export const completeTaskAndAwardStars = async (options: {
  userId: string
  childId: string
  taskId: string
  taskCollection: TaskCollection
  dateKey: string
  delta: number
  updates: Record<string, unknown>
  initialTaskData?: Record<string, unknown>
  deleteOnComplete?: boolean
}) => {
  if (isOfflineEnabled()) {
    const { offlineCompletion } = await import('../offline/actions')
    return offlineCompletion(options)
  }
  const {
    userId,
    childId,
    taskId,
    taskCollection,
    dateKey,
    delta,
    updates,
    initialTaskData,
    deleteOnComplete = false,
  } = options
  if (!userId || !childId || !taskId || !dateKey || !Number.isFinite(delta)) {
    throw new Error('Invalid task completion request')
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const taskRef = doc(db, 'users', userId, taskCollection, taskId)
  const eventRef = doc(collection(db, 'users', userId, 'starEvents'))

  return runTransaction(db, async (transaction) => {
    const [childSnapshot, taskSnapshot] = await Promise.all([
      transaction.get(childRef),
      transaction.get(taskRef),
    ])
    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    if (!taskSnapshot.exists() && !initialTaskData) {
      throw new Error('Task not found')
    }

    if (taskSnapshot.exists() && taskSnapshot.data()?.childId !== childId) {
      throw new Error('Task does not belong to the selected child')
    }

    // Completion and stars commit together. A reset clears this guard, so
    // another attempt can earn stars even on the same day.
    if (
      taskSnapshot.exists() &&
      hasCompletedAttempt(taskSnapshot.data(), taskCollection, dateKey)
    ) {
      return { appliedDelta: 0, wasAlreadyAwarded: true }
    }

    if (deleteOnComplete) {
      if (taskSnapshot.exists()) transaction.delete(taskRef)
    } else if (taskSnapshot.exists()) {
      transaction.update(taskRef, updates)
    } else {
      transaction.set(taskRef, { ...initialTaskData, ...updates })
    }

    const currentStars = Number(childSnapshot.data()?.totalStars ?? 0)
    const clampedDelta = Math.max(delta, -currentStars)

    transaction.set(eventRef, {
      childId,
      taskId,
      taskCollection,
      dateKey,
      delta: clampedDelta,
      createdAt: serverTimestamp(),
    })

    if (clampedDelta !== 0) {
      transaction.update(childRef, {
        totalStars: increment(clampedDelta),
      })
    }

    return {
      appliedDelta: clampedDelta,
      wasAlreadyAwarded: false,
      starsBefore: currentStars,
    }
  })
}

type RedeemOptions = {
  userId: string
  childId: string
  reward: {
    id: string
    title: string
    costStars: number
  }
}

export const redeemReward = async ({
  userId,
  childId,
  reward,
}: RedeemOptions) => {
  if (isOfflineEnabled()) {
    const { offlineRedemption } = await import('../offline/actions')
    return offlineRedemption(userId, childId, reward)
  }
  if (!userId || !childId) {
    throw new Error('Invalid redemption request')
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const rewardRef = doc(db, 'users', userId, 'rewards', reward.id)
  const redemptionRef = doc(collection(db, 'users', userId, 'redemptions'))

  return runTransaction(db, async (transaction) => {
    const [childSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(childRef),
      transaction.get(rewardRef),
    ])
    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    if (!rewardSnapshot.exists()) {
      throw new Error('Reward is no longer available')
    }

    const rewardData = rewardSnapshot.data()
    const storedCost = Number(rewardData.costStars)
    if (!Number.isFinite(storedCost) || storedCost < 0) {
      throw new Error('Reward has an invalid cost')
    }

    const storedTitle =
      typeof rewardData.title === 'string' ? rewardData.title : reward.title
    const currentStars = Number(childSnapshot.data()?.totalStars ?? 0)
    if (currentStars < storedCost) {
      throw new Error('Not enough stars to redeem this reward')
    }

    transaction.set(redemptionRef, {
      childId,
      rewardId: reward.id,
      rewardTitle: storedTitle,
      costStars: storedCost,
      createdAt: serverTimestamp(),
    })

    transaction.update(childRef, {
      totalStars: increment(-storedCost),
    })

    if (rewardData.isRepeating !== true) {
      transaction.delete(rewardRef)
    }
    return {
      title: storedTitle,
      starsBefore: currentStars,
      starsAfter: currentStars - storedCost,
    }
  })
}
