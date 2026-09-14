import { useCallback, useEffect, useRef, useState } from 'react'
import type { RewardRecord } from '../data/types'
import type { RewardCelebrationDetails } from '../components/RewardCelebration'

type Options = {
  activeChildId: string | null
  rewards: RewardRecord[]
  giveReward: (reward: RewardRecord) => Promise<{
    title: string
    starsBefore: number
    starsAfter: number
  }>
}

export const useRewardCelebration = ({
  activeChildId,
  rewards,
  giveReward,
}: Options) => {
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [celebration, setCelebration] = useState<
    | (RewardCelebrationDetails & { childId: string | null; rewardId: string })
    | null
  >(null)
  const [retainedReward, setRetainedReward] = useState<{
    reward: RewardRecord
    index: number
    childId: string | null
  } | null>(null)
  const finishCelebration = useCallback(() => {
    setCelebration(null)
    setRetainedReward(null)
  }, [])
  const purchasePending = useRef(false)
  const purchaseSession = useRef(0)

  useEffect(
    () => () => {
      purchaseSession.current += 1
    },
    [activeChildId]
  )

  const handleGiveReward = async (reward: RewardRecord) => {
    if (purchasePending.current || celebration?.childId === activeChildId)
      return
    purchasePending.current = true
    const session = purchaseSession.current
    // Preserve one-time rewards until the animation finishes, even if the live
    // collection removes them before the transaction promise resolves.
    setRetainedReward({
      reward,
      index: rewards.findIndex((item) => item.id === reward.id),
      childId: activeChildId,
    })
    setIsRedeeming(true)
    try {
      const result = await giveReward(reward)
      if (session === purchaseSession.current) {
        setCelebration({
          ...result,
          imageKey: reward.imageKey,
          childId: activeChildId,
          rewardId: reward.id,
        })
      }
    } catch (error) {
      setRetainedReward(null)
      throw error
    } finally {
      purchasePending.current = false
      setIsRedeeming(false)
    }
  }

  return {
    isRedeeming,
    celebration,
    retainedReward,
    finishCelebration,
    handleGiveReward,
  }
}
