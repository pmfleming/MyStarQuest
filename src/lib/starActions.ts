import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const awardStars = async (options: {
  userId: string
  childId: string
  delta: number
}) => {
  const { userId, childId, delta } = options
  if (!userId || !childId || !Number.isFinite(delta)) {
    throw new Error('Invalid award request')
  }

  if (delta === 0) {
    return
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const starEventsCollection = collection(db, 'users', userId, 'starEvents')
  const newEventRef = doc(starEventsCollection)

  await runTransaction(db, async (transaction) => {
    const childSnapshot = await transaction.get(childRef)
    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    const currentStars = Number(childSnapshot.data()?.totalStars ?? 0)
    const clampedDelta = Math.max(delta, -currentStars)

    if (clampedDelta === 0) return

    transaction.set(newEventRef, {
      childId,
      delta: clampedDelta,
      createdAt: serverTimestamp(),
    })

    transaction.update(childRef, {
      totalStars: increment(clampedDelta),
    })
  })
}

export const completeTodoAndAwardStars = async (options: {
  userId: string
  childId: string
  todoId: string
  delta: number
  updates?: Record<string, unknown>
}) => {
  const { userId, childId, todoId, delta, updates } = options
  if (!userId || !childId || !todoId || !Number.isFinite(delta)) {
    throw new Error('Invalid todo completion request')
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const todoRef = doc(db, 'users', userId, 'todos', todoId)
  const starEventsCollection = collection(db, 'users', userId, 'starEvents')
  const newEventRef = doc(starEventsCollection)

  return runTransaction(db, async (transaction) => {
    const [childSnapshot, todoSnapshot] = await Promise.all([
      transaction.get(childRef),
      transaction.get(todoRef),
    ])

    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    if (!todoSnapshot.exists()) {
      throw new Error('Todo not found')
    }

    if (todoSnapshot.data()?.completedAt) {
      return false
    }

    const currentStars = Number(childSnapshot.data()?.totalStars ?? 0)
    const clampedDelta = Math.max(delta, -currentStars)

    if (clampedDelta !== 0) {
      transaction.set(newEventRef, {
        childId,
        delta: clampedDelta,
        createdAt: serverTimestamp(),
        todoId,
      })

      transaction.update(childRef, {
        totalStars: increment(clampedDelta),
      })
    }

    transaction.update(todoRef, {
      completedAt: Date.now(),
      ...(updates ?? {}),
    })

    return true
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
  const redemptionRef = doc(collection(db, 'users', userId, 'redemptions'))

  await runTransaction(db, async (transaction) => {
    const childSnapshot = await transaction.get(childRef)
    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    const currentStars = Number(childSnapshot.data()?.totalStars ?? 0)
    if (currentStars < reward.costStars) {
      throw new Error('Not enough stars to redeem this reward')
    }

    transaction.set(redemptionRef, {
      childId,
      rewardId: reward.id,
      rewardTitle: reward.title,
      costStars: reward.costStars,
      createdAt: serverTimestamp(),
    })

    transaction.update(childRef, {
      totalStars: increment(-reward.costStars),
    })
  })
}
