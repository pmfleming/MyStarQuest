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
  if (!userId || !childId || delta <= 0) {
    throw new Error('Invalid award request')
  }

  const childRef = doc(db, 'users', userId, 'children', childId)
  const starEventsCollection = collection(db, 'users', userId, 'starEvents')
  const newEventRef = doc(starEventsCollection)

  await runTransaction(db, async (transaction) => {
    const childSnapshot = await transaction.get(childRef)
    if (!childSnapshot.exists()) {
      throw new Error('Child not found')
    }

    transaction.set(newEventRef, {
      childId,
      delta,
      createdAt: serverTimestamp(),
    })

    transaction.update(childRef, {
      totalStars: increment(delta),
    })
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
