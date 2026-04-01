// ── Real-time rewards subscription + all reward mutations ──

import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { redeemReward } from '../lib/starActions'
import {
  childStarsSnapshotDataSchema,
  rewardSnapshotDataSchema,
  type RewardRecord,
  type RewardUpdatableFields,
} from './types'

export function useRewards() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [activeChildStars, setActiveChildStars] = useState<number>(0)
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

  // ── Rewards subscription ──
  useEffect(() => {
    if (!user) {
      setRewards([])
      return
    }

    const rewardsQuery = query(
      collection(db, 'users', user.uid, 'rewards'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      const newRewards: RewardRecord[] = snapshot.docs.flatMap(
        (docSnapshot) => {
          const parsed = rewardSnapshotDataSchema.safeParse(docSnapshot.data())
          if (!parsed.success) {
            console.warn('Skipping invalid reward snapshot', {
              id: docSnapshot.id,
              issues: parsed.error.issues,
            })
            return []
          }

          const data = parsed.data
          return [
            {
              id: docSnapshot.id,
              title: data.title,
              costStars: data.costStars,
              isRepeating: data.isRepeating,
              createdAt: data.createdAt?.toDate?.(),
            },
          ]
        }
      )

      setRewards(newRewards)

      setTitleDrafts((prev) => {
        const next = { ...prev }
        for (const reward of newRewards) {
          if (!(reward.id in next)) {
            next[reward.id] = reward.title
          }
        }
        return next
      })
    })

    return unsubscribe
  }, [user])

  // ── Active child star balance subscription ──
  useEffect(() => {
    if (!user || !activeChildId) {
      setActiveChildStars(0)
      return
    }

    const childRef = doc(db, 'users', user.uid, 'children', activeChildId)
    const unsubscribe = onSnapshot(childRef, (snapshot) => {
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
    })

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
  const createReward = async () => {
    if (!user) return
    await addDoc(collection(db, 'users', user.uid, 'rewards'), {
      title: '',
      costStars: 0,
      isRepeating: true,
      createdAt: serverTimestamp(),
    })
  }

  // ── Give (redeem) reward ──
  const giveReward = async (reward: RewardRecord) => {
    if (!user || !activeChildId) {
      throw new Error('Please select a child from the dashboard first.')
    }

    await redeemReward({
      userId: user.uid,
      childId: activeChildId,
      reward,
    })

    if (!reward.isRepeating) {
      await deleteDoc(
        doc(collection(db, 'users', user.uid, 'rewards'), reward.id)
      )
    }
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
    createReward,
    giveReward,
    deleteReward,
  }
}
