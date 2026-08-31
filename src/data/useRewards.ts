// ── Real-time rewards subscription + all reward mutations ──

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { redeemReward } from '../lib/starActions'
import {
  childStarsSnapshotDataSchema,
  rewardSnapshotDataSchema,
  type RewardRecord,
  type RewardUpdatableFields,
} from './types'
import { useCollectionTitleDrafts } from './dailyTaskState'
import { useUserCollection } from './useUserCollection'
import { mergeOptimisticItems } from '../hooks/useCoalescedDocumentUpdates'
import { useUserDocumentUpdates } from './useUserDocumentUpdates'

export type RewardDocumentSettings = {
  title: string
  costStars: number
  isRepeating: boolean
  imageKey?: string
}

export function useRewards() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [activeChildStars, setActiveChildStars] = useState<number>(0)

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

  useEffect(() => {
    reconcileRewardFields(rawRewards)
  }, [rawRewards, reconcileRewardFields])

  const rewards = useMemo(
    () => mergeOptimisticItems(rawRewards, optimisticFields),
    [optimisticFields, rawRewards]
  )

  const updateRewardField = (rewardId: string, field: RewardUpdatableFields) =>
    queueRewardField(rewardId, field)
  const {
    drafts: titleDrafts,
    setDraft: setTitleDraft,
    removeDraft: removeTitleDraft,
    commitDraft: commitTitle,
  } = useCollectionTitleDrafts(rawRewards, (rewardId, title) =>
    updateRewardField(rewardId, { title })
  )

  // ── Active child star balance subscription ──
  useEffect(() => {
    if (!user || !activeChildId) {
      setActiveChildStars(0)
      return
    }

    const childRef = doc(db, 'users', user.uid, 'children', activeChildId)
    const unsubscribe = onSnapshot(
      childRef,
      (snapshot) => {
        const parsed = childStarsSnapshotDataSchema.safeParse(snapshot.data())
        if (!parsed.success) {
          console.warn('Invalid child star balance snapshot', {
            id: activeChildId,
            issues: parsed.error.issues,
          })
          setActiveChildStars(0)
          return
        }

        setActiveChildStars(parsed.data.totalStars)
      },
      (error) => {
        console.error('Failed to subscribe to child star balance', error)
        setActiveChildStars(0)
      }
    )

    return unsubscribe
  }, [user, activeChildId])

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
    await addDoc(collection(db, 'users', user.uid, 'rewards'), {
      title: settings.title,
      costStars: Math.max(0, settings.costStars),
      isRepeating: settings.isRepeating,
      imageKey: settings.imageKey ?? '',
      createdAt: serverTimestamp(),
    })
  }

  // ── Give (redeem) reward ──
  const giveReward = async (reward: RewardRecord) => {
    if (!user || !activeChildId) {
      throw new Error('Please select a child from the chores tab first.')
    }

    await redeemReward({
      userId: user.uid,
      childId: activeChildId,
      reward,
    })
  }

  // ── Delete ──
  const deleteReward = async (id: string) => {
    if (!user) return
    cancelRewardFieldUpdate(id)
    await deleteDoc(doc(collection(db, 'users', user.uid, 'rewards'), id))
    removeTitleDraft(id)
  }

  return {
    rewards,
    activeChildStars,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateRewardField,
    createStandardReward,
    giveReward,
    deleteReward,
  }
}
