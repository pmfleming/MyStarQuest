// ── Real-time rewards subscription + all reward mutations ──

import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
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
import { mergeMissingTitleDrafts } from './dailyTaskState'
import { useUserCollection } from './useUserCollection'

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
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

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

  const handleRewards = useCallback((nextRewards: RewardRecord[]) => {
    setTitleDrafts((prev) => mergeMissingTitleDrafts(prev, nextRewards))
  }, [])

  const rewards = useUserCollection({
    userId: user?.uid,
    collectionName: 'rewards',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to rewards',
    mapDocument: mapRewardDocument,
    onItems: handleRewards,
  })

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

  // ── Generic field update ──
  const updateRewardField = async (
    rewardId: string,
    field: RewardUpdatableFields
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'rewards'), rewardId),
        field
      )
    } catch (error) {
      console.error('Failed to update reward', error)
    }
  }

  // ── Title draft helpers ──
  const setTitleDraft = (rewardId: string, value: string) =>
    setTitleDrafts((prev) => ({ ...prev, [rewardId]: value }))

  const commitTitle = (rewardId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateRewardField(rewardId, { title: trimmed })
      return
    }
    const saved = rewards.find((r) => r.id === rewardId)
    if (saved) {
      setTitleDrafts((prev) => ({ ...prev, [rewardId]: saved.title }))
    }
  }

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
    await deleteDoc(doc(collection(db, 'users', user.uid, 'rewards'), id))
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
