import { useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import StarDisplay from '../components/StarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import { uiTokens } from '../ui/tokens'
import { useRewards } from '../data/useRewards'
import type { RewardRecord } from '../data/types'
import {
  princessBuyRewardIcon,
  princessHomeIcon,
} from '../assets/themes/princess/assets'

const ManageRewardsPage = () => {
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

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Rewards"
        fontFamily={theme.fonts.heading}
        right={
          <TopIconButton
            theme={theme}
            to="/"
            ariaLabel="Home"
            icon={
              <img
                src={princessHomeIcon}
                alt="Home"
                className="h-10 w-10 object-contain"
              />
            }
          />
        }
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          <StandardActionList
            theme={theme}
            items={rewards}
            getKey={(reward) => reward.id}
            renderItem={(reward) => (
              <div
                className="flex flex-col"
                style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
              >
                <ActionTextInput
                  theme={theme}
                  label="Reward"
                  value={titleDrafts[reward.id] ?? reward.title}
                  onChange={(value) => setTitleDraft(reward.id, value)}
                  onCommit={(value) => commitTitle(reward.id, value)}
                  maxLength={80}
                  baseColor={theme.colors.secondary}
                  inputAriaLabel="Reward name"
                  transparent
                />

                <StarDisplay
                  theme={theme}
                  count={reward.costStars}
                  editable
                  onChange={(value) =>
                    updateRewardField(reward.id, {
                      costStars: Math.max(0, Math.min(10, value)),
                    })
                  }
                  min={0}
                  max={10}
                />

                <RepeatControl
                  theme={theme}
                  value={reward.isRepeating}
                  onChange={(value) =>
                    updateRewardField(reward.id, { isRepeating: value })
                  }
                  label="Keep available after buying"
                  showLabel={false}
                  showFeedback={false}
                />
              </div>
            )}
            primaryAction={{
              label: (reward) =>
                activeChildStars >= reward.costStars
                  ? 'Buy Reward'
                  : 'Need Stars',
              icon: (reward) =>
                activeChildStars >= reward.costStars ? (
                  <img
                    src={princessBuyRewardIcon}
                    alt="Buy Reward"
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  '🔒'
                ),
              onClick: (reward) => handleGiveReward(reward),
              disabled: (reward) =>
                isRedeeming ||
                !activeChildId ||
                activeChildStars < reward.costStars,
              variant: 'primary',
              showLabel: false,
            }}
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
      </main>
    </PageShell>
  )
}

export default ManageRewardsPage
