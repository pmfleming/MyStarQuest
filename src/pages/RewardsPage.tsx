import { useCallback, useEffect, useRef, useState } from 'react'
import RewardCelebration, {
  type RewardCelebrationDetails,
} from '../components/RewardCelebration'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import { getSurfaceWidthConstraints } from '../tokens'
import { createRewardDefinitionListRowDescriptor } from '../ui/definitionRowDescriptors'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { useRewards } from '../data/useRewards'
import RewardCreationFlow from './RewardCreationFlow'
import InlineNotice from '../components/ui/InlineNotice'
import type { RewardRecord } from '../data/types'
import type { RewardDocumentSettings } from '../data/useRewards'

const RewardsPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
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
  const [showAddReward, setShowAddReward] = useState(false)
  const [isCreatingReward, setIsCreatingReward] = useState(false)
  const [createRewardError, setCreateRewardError] = useState<string | null>(
    null
  )

  const {
    rewards,
    activeChildStars,
    createStandardReward,
    giveReward,
    deleteReward,
  } = useRewards()

  const handleGiveReward = async (reward: RewardRecord) => {
    if (purchasePending.current || celebration?.childId === activeChildId)
      return
    purchasePending.current = true
    const session = purchaseSession.current
    // Keep one-time rewards in their original card until the reveal finishes,
    // including when the live collection removes them before the promise resolves.
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

  const handleDelete = async (id: string) => {
    try {
      await deleteReward(id)
    } catch (error) {
      console.error('Failed to delete reward', error)
      throw error
    }
  }

  const handleCreateReward = async (settings: RewardDocumentSettings) => {
    if (isCreatingReward) return

    setIsCreatingReward(true)
    setCreateRewardError(null)
    try {
      await createStandardReward(settings)
      setShowAddReward(false)
    } catch (error) {
      console.error('Failed to create reward', error)
      setCreateRewardError('Could not save reward.')
    } finally {
      setIsCreatingReward(false)
    }
  }

  const rewardListDescriptor = toStandardActionListDescriptor(
    // The descriptor stores this click handler; it never calls it during render.
    // eslint-disable-next-line react-hooks/refs
    createRewardDefinitionListRowDescriptor({
      theme,
      activeChildId,
      activeChildStars,
      isRedeeming: isRedeeming || celebration?.childId === activeChildId,
      handleGiveReward,
    })
  )
  const visibleRewards: RewardRecord[] = [...rewards]
  if (
    retainedReward?.childId === activeChildId &&
    retainedReward &&
    !visibleRewards.some((item) => item.id === retainedReward.reward.id)
  ) {
    visibleRewards.splice(
      Math.max(0, retainedReward.index),
      0,
      retainedReward.reward
    )
  }
  const activeCelebration =
    celebration?.childId === activeChildId ? celebration : null

  return (
    <TabContent theme={theme} title="Rewards">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          paddingBottom: '96px',
        }}
      >
        {createRewardError && (
          <InlineNotice theme={theme} className="mb-6">
            {createRewardError}
          </InlineNotice>
        )}
        <StandardActionList
          theme={theme}
          items={visibleRewards}
          getKey={(reward) => reward.id}
          getItemLabel={(reward) => reward.title}
          {...rewardListDescriptor}
          renderItem={(reward) => {
            const celebrating = activeCelebration?.rewardId === reward.id
            return (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: 20,
                }}
              >
                <div
                  style={{ visibility: celebrating ? 'hidden' : 'visible' }}
                  aria-hidden={celebrating || undefined}
                >
                  {rewardListDescriptor.renderItem(reward)}
                </div>
                {celebrating && activeCelebration && (
                  <RewardCelebration
                    reward={activeCelebration}
                    theme={theme}
                    onComplete={finishCelebration}
                  />
                )}
              </div>
            )
          }}
          utilityAction={{
            label: 'Delete',
            ariaLabel: (reward) => `Delete ${reward.title}`,
            exits: true,
            disabled: (reward) =>
              retainedReward?.childId === activeChildId &&
              retainedReward?.reward.id === reward.id,
            onClick: (reward) => handleDelete(reward.id),
          }}
          hideEdit
          onDelete={(reward) => handleDelete(reward.id)}
          addLabel="New Reward"
          onAdd={() => setShowAddReward(true)}
          addDisabled={isCreatingReward}
          inlineNewRow={
            showAddReward ? (
              <RewardCreationFlow
                theme={theme}
                isSaving={isCreatingReward}
                onSave={handleCreateReward}
                onCancel={() => {
                  setCreateRewardError(null)
                  setShowAddReward(false)
                }}
              />
            ) : undefined
          }
          emptyState={
            <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
              No rewards yet.
            </div>
          }
        />
      </div>
    </TabContent>
  )
}

export default RewardsPage
