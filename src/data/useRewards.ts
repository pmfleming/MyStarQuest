import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { saveDocument } from '../offline/actions'
import { isOfflineEnabled } from '../offline/platform'
import { parseChildScope } from '../sharing/scope'
// ── Real-time rewards subscription + all reward mutations ──

import { useCallback } from 'react'
import { useChildren } from './useChildren'
import { useAuth } from '../auth/AuthContext'
import { useDataScope } from '../sharing/ChildAccessContext'
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
  const { storageKey } = useDataScope()
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
    userId: storageKey,
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
    return createUserDocument(storageKey!, 'rewards', {
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
      userId: storageKey!,
      childId: activeChildId,
      reward,
    })
  }

  // ── Delete ──
  const deleteReward = async (id: string) => {
    if (!user) return
    await deleteUserDocument(storageKey!, 'rewards', id)
  }

  const updateReward = async (id: string, settings: RewardDocumentSettings) => {
    if (!storageKey) return
    const data = { ...settings, imageKey: settings.imageKey ?? '' }
    if (isOfflineEnabled() || parseChildScope(storageKey))
      await saveDocument(storageKey, 'rewards', id, 'patch', data)
    else await updateDoc(doc(db, 'users', storageKey, 'rewards', id), data)
  }
  return {
    updateReward,
    rewards,
    activeChildStars: user && activeChildId ? activeChildStars : 0,
    createStandardReward,
    giveReward,
    deleteReward,
  }
}
