import { useState } from 'react'
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
    setIsRedeeming(true)
    try {
      await giveReward(reward)
    } finally {
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
    createRewardDefinitionListRowDescriptor({
      theme,
      activeChildId,
      activeChildStars,
      isRedeeming,
      handleGiveReward,
    })
  )

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
          items={rewards}
          getKey={(reward) => reward.id}
          getItemLabel={(reward) => reward.title}
          {...rewardListDescriptor}
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
