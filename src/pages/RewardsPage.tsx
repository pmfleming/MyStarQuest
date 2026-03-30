import { useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import { uiTokens } from '../tokens'
import { createRewardDefinitionListRowDescriptor } from '../ui/definitionRowDescriptors'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { useRewards } from '../data/useRewards'
import type { RewardRecord } from '../data/types'

const RewardsPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [isRedeeming, setIsRedeeming] = useState(false)

  const {
    rewards,
    activeChildStars,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateRewardField,
    createReward,
    giveReward,
    deleteReward,
  } = useRewards()

  const handleGiveReward = async (reward: RewardRecord) => {
    const confirmGive = window.confirm(
      `Give "${reward.title}" to the active child for ${reward.costStars} stars?`
    )
    if (!confirmGive) return

    setIsRedeeming(true)
    try {
      await giveReward(reward)
      alert('Reward given successfully!')
    } catch (error) {
      console.error('Failed to give reward', error)
      const message =
        error instanceof Error ? error.message : 'Failed to give reward'
      alert(message)
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Delete this reward?')
    if (!confirmDelete) return
    try {
      await deleteReward(id)
    } catch (error) {
      console.error('Failed to delete reward', error)
    }
  }

  const rewardListDescriptor = toStandardActionListDescriptor(
    createRewardDefinitionListRowDescriptor({
      theme,
      activeChildId,
      activeChildStars,
      isRedeeming,
      titleDrafts,
      setTitleDraft,
      commitTitle,
      updateRewardField,
      handleGiveReward,
    })
  )

  return (
    <TabContent theme={theme} title="Rewards">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: `${uiTokens.contentMaxWidth}px`,
          paddingBottom: '96px',
        }}
      >
        <StandardActionList
          theme={theme}
          items={rewards}
          getKey={(reward) => reward.id}
          {...rewardListDescriptor}
          hideEdit
          onDelete={(reward) => handleDelete(reward.id)}
          addLabel="New Reward"
          onAdd={createReward}
          addDisabled={false}
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
