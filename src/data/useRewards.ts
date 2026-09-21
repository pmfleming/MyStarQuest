// ── Real-time rewards subscription + all reward mutations ──

import { useCallback } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isOfflineEnabled } from '../offline/platform'
import { saveDocument } from '../offline/actions'
import { useChildren } from './useChildren'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { redeemReward } from '../lib/starActions'
import {
  rewardSnapshotDataSchema,
  type RewardRecord,
  type RewardUpdatableFields,
} from './types'
import { useCollectionTitleDrafts } from './dailyTaskState'
import { useUserCollection } from './useUserCollection'
import { useOptimisticItems } from '../hooks/useCoalescedDocumentUpdates'
import {
  createUserDocument,
  useUserDocumentUpdates,
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

  const {
    overrides: optimisticFields,
    queueUpdate: queueRewardField,
    cancelUpdate: cancelRewardFieldUpdate,
    reconcile: reconcileRewardFields,
  } = useUserDocumentUpdates<RewardUpdatableFields>({
    userId: user?.uid,
    collectionName: 'rewards',
    errorMessage: 'Failed to update reward',
  })

  const rawRewards = useUserCollection({
    userId: user?.uid,
    collectionName: 'rewards',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to rewards',
    mapDocument: mapRewardDocument,
  })

  const rewards = useOptimisticItems(
    rawRewards,
    optimisticFields,
    reconcileRewardFields
  )

  const updateRewardField = queueRewardField
  const {
    drafts: titleDrafts,
    setDraft: setTitleDraft,
    removeDraft: removeTitleDraft,
    commitDraft: commitTitle,
  } = useCollectionTitleDrafts(rawRewards, (rewardId, title) =>
    updateRewardField(rewardId, { title })
  )

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
    cancelRewardFieldUpdate(id)
    if (isOfflineEnabled())
      await saveDocument(user.uid, 'rewards', id, 'delete')
    else await deleteDoc(doc(db, 'users', user.uid, 'rewards', id))
    removeTitleDraft(id)
  }

  return {
    rewards,
    activeChildStars: user && activeChildId ? activeChildStars : 0,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateRewardField,
    createStandardReward,
    giveReward,
    deleteReward,
  }
}
