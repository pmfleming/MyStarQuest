// ── Real-time rewards subscription + all reward mutations ──

import { useCallback } from 'react'
import { useChildren } from './useChildren'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { redeemReward } from '../lib/starActions'
import { rewardSnapshotDataSchema, type RewardRecord } from './types'
import { useUserCollection } from './useUserCollection'
import {
  createUserDocument,
  deleteUserDocument,
} from './useUserDocumentUpdates'

export type RewardDocumentSettings = {
  title: string
  costStars: number
  isRepeating: boolean
  imageKey?: string
}

export function useRewards() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { children } = useChildren()
  const activeChildStars =
    children.find((child) => child.id === activeChildId)?.totalStars ?? 0

  const mapRewardDocument = useCallback((id: string, data: unknown) => {
    const parsed = rewardSnapshotDataSchema.safeParse(data)
    if (!parsed.success) {
      console.warn('Skipping invalid reward snapshot', {
        id,
        issues: parsed.error.issues,
      })
      return null
    }

    const rewardData = parsed.data
    return {
      id,
      title: rewardData.title,
      costStars: rewardData.costStars,
      isRepeating: rewardData.isRepeating,
      imageKey: rewardData.imageKey,
      createdAt: rewardData.createdAt?.toDate?.(),
    }
  }, [])

  const rewards = useUserCollection({
    userId: user?.uid,
    collectionName: 'rewards',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to rewards',
    mapDocument: mapRewardDocument,
  })

  // ── Create ──
  const createStandardReward = async (
    settings: RewardDocumentSettings = {
      title: '',
      costStars: 0,
      isRepeating: true,
      imageKey: '',
    }
  ) => {
    if (!user) return
    return createUserDocument(user.uid, 'rewards', {
      title: settings.title,
      costStars: Math.max(0, settings.costStars),
      isRepeating: settings.isRepeating,
      imageKey: settings.imageKey ?? '',
    })
  }

  // ── Give (redeem) reward ──
  const giveReward = async (reward: RewardRecord) => {
    if (!user || !activeChildId) {
      throw new Error('Please select a child from the chores tab first.')
    }

    return redeemReward({
      userId: user.uid,
      childId: activeChildId,
      reward,
    })
  }

  // ── Delete ──
  const deleteReward = async (id: string) => {
    if (!user) return
    await deleteUserDocument(user.uid, 'rewards', id)
  }

  return {
    rewards,
    activeChildStars: user && activeChildId ? activeChildStars : 0,
    createStandardReward,
    giveReward,
    deleteReward,
  }
}
