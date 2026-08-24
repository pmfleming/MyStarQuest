import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebaseDb'

type TaskCollection = 'chores' | 'tests'

const buildTaskCompletionEventId = (
  taskCollection: TaskCollection,
  taskId: string,
  dateKey: string
) => `${taskCollection}-${taskId}-${dateKey}`

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
  const eventRef = doc(
    db,
    'users',
    userId,
    'starEvents',
    buildTaskCompletionEventId(taskCollection, taskId, dateKey)
  )

  return runTransaction(db, async (transaction) => {
    const [childSnapshot, taskSnapshot, eventSnapshot] = await Promise.all([
      transaction.get(childRef),
      transaction.get(taskRef),
      transaction.get(eventRef),
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

    if (deleteOnComplete) {
      if (taskSnapshot.exists()) transaction.delete(taskRef)
    } else if (taskSnapshot.exists()) {
      transaction.update(taskRef, updates)
    } else {
      transaction.set(taskRef, { ...initialTaskData, ...updates })
    }

    if (eventSnapshot.exists()) {
      return { appliedDelta: 0, wasAlreadyAwarded: true }
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

    return { appliedDelta: clampedDelta, wasAlreadyAwarded: false }
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
  if (!userId || !childId) {
    throw new Error('Invalid redemption request')
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const rewardRef = doc(db, 'users', userId, 'rewards', reward.id)
  const redemptionRef = doc(collection(db, 'users', userId, 'redemptions'))

  await runTransaction(db, async (transaction) => {
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
  })
}
