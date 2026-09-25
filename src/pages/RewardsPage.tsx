import { useState } from 'react'
import RewardCelebration from '../components/RewardCelebration'
import { getRewardImage, getRewardOverlayImage } from '../assets/rewards/assets'
import { useRewardCelebration } from '../hooks/useRewardCelebration'
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

  const {
    isRedeeming,
    celebration,
    retainedReward,
    finishCelebration,
    handleGiveReward,
  } = useRewardCelebration({ activeChildId, rewards, giveReward })

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
    retainedReward &&
    retainedReward.childId === activeChildId &&
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
                    imageSrc={getRewardImage(activeCelebration.imageKey)}
                    overlayImage={getRewardOverlayImage(
                      activeCelebration.title,
                      activeCelebration.imageKey
                    )}
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
            onClick: (reward) => deleteReward(reward.id),
          }}
          hideEdit
          onDelete={(reward) => deleteReward(reward.id)}
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
