import type { ReactNode } from 'react'
import Carousel from '../components/Carousel'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import StarDisplay from '../components/StarDisplay'
import {
  princessActiveIcon,
  princessBuyRewardIcon,
  princessSelectIcon,
} from '../assets/themes/princess/assets'
import type { ThemeId } from './themeOptions'
import type { Theme } from '../contexts/ThemeContext'
import type { ChildProfile, RewardRecord } from '../data/types'
import { uiTokens } from './tokens'
import type { ListRowDescriptor } from './listDescriptorTypes'

type ThemeOption = {
  id: ThemeId
  label: string
  image: string
}

type ChildDefinitionDescriptorDeps = {
  theme: Theme
  activeChildId: string | null
  themeOptions: ThemeOption[]
  carouselItems: Array<{ id: ThemeId; label: string; icon: ReactNode }>
  nameDrafts: Record<string, string>
  setNameDraft: (childId: string, value: string) => void
  commitDisplayName: (childId: string, value: string) => void | Promise<void>
  updateChildField: (
    childId: string,
    value: Record<string, unknown>
  ) => void | Promise<void>
  changeTheme: (child: ChildProfile, themeId: ThemeId) => void | Promise<void>
  selectChild: (childId: string) => void | Promise<void>
}

type RewardDefinitionDescriptorDeps = {
  theme: Theme
  activeChildId: string | null
  activeChildStars: number
  isRedeeming: boolean
  titleDrafts: Record<string, string>
  setTitleDraft: (rewardId: string, value: string) => void
  commitTitle: (rewardId: string, value: string) => void | Promise<void>
  updateRewardField: (
    rewardId: string,
    value: Record<string, unknown>
  ) => void | Promise<void>
  handleGiveReward: (reward: RewardRecord) => void | Promise<void>
}

export const createChildDefinitionListRowDescriptor = (
  deps: ChildDefinitionDescriptorDeps
): ListRowDescriptor<ChildProfile> => ({
  renderItem: (child) => {
    const currentThemeId = child.themeId || 'princess'
    const currentThemeIndex = Math.max(
      0,
      deps.themeOptions.findIndex((option) => option.id === currentThemeId)
    )

    return (
      <div
        className="flex flex-col"
        style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
      >
        <ActionTextInput
          theme={deps.theme}
          label="Name"
          value={deps.nameDrafts[child.id] ?? child.displayName}
          onChange={(value) => deps.setNameDraft(child.id, value)}
          onCommit={(value) => deps.commitDisplayName(child.id, value)}
          maxLength={40}
          baseColor={deps.theme.colors.primary}
          inputAriaLabel="Child name"
          transparent
        />

        <Carousel
          key={`${child.id}-${currentThemeId}`}
          items={deps.carouselItems}
          title="Select Theme"
          initialIndex={currentThemeIndex}
          onChange={(index) => {
            const selected = deps.themeOptions[index]
            if (!selected) return
            deps.changeTheme(child, selected.id)
          }}
        />

        <StarDisplay
          theme={deps.theme}
          count={child.totalStars}
          editable
          min={0}
          max={999}
          onChange={(value) =>
            deps.updateChildField(child.id, { totalStars: value })
          }
        />
      </div>
    )
  },
  isHighlighted: (child) => deps.activeChildId === child.id,
  getPrimaryAction: (child) => ({
    label: deps.activeChildId === child.id ? 'Active' : 'Select',
    ariaLabel:
      deps.activeChildId === child.id ? 'Active child' : 'Select child',
    icon:
      deps.theme.id === 'princess' ? (
        <img
          src={
            deps.activeChildId === child.id
              ? princessActiveIcon
              : princessSelectIcon
          }
          alt={deps.activeChildId === child.id ? 'Active' : 'Select'}
          className="h-6 w-6 object-contain"
        />
      ) : deps.activeChildId === child.id ? (
        '✅'
      ) : (
        '⭐'
      ),
    showLabel: false,
    disabled: deps.activeChildId === child.id,
    variant: deps.theme.id === 'princess' ? 'neutral' : 'primary',
    onClick: (item) => deps.selectChild(item.id),
  }),
})

export const createRewardDefinitionListRowDescriptor = (
  deps: RewardDefinitionDescriptorDeps
): ListRowDescriptor<RewardRecord> => ({
  renderItem: (reward) => (
    <div
      className="flex flex-col"
      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
    >
      <ActionTextInput
        theme={deps.theme}
        label="Reward"
        value={deps.titleDrafts[reward.id] ?? reward.title}
        onChange={(value) => deps.setTitleDraft(reward.id, value)}
        onCommit={(value) => deps.commitTitle(reward.id, value)}
        maxLength={80}
        baseColor={deps.theme.colors.secondary}
        inputAriaLabel="Reward name"
        transparent
      />

      <StarDisplay
        theme={deps.theme}
        count={reward.costStars}
        editable
        onChange={(value) =>
          deps.updateRewardField(reward.id, {
            costStars: Math.max(0, Math.min(10, value)),
          })
        }
        min={0}
        max={10}
      />

      <RepeatControl
        theme={deps.theme}
        value={reward.isRepeating}
        onChange={(value) =>
          deps.updateRewardField(reward.id, { isRepeating: value })
        }
        label="Keep available after buying"
        showLabel={false}
        showFeedback={false}
      />
    </div>
  ),
  getPrimaryAction: (reward) => ({
    label:
      deps.activeChildStars >= reward.costStars ? 'Buy Reward' : 'Need Stars',
    icon:
      deps.activeChildStars >= reward.costStars ? (
        <img
          src={princessBuyRewardIcon}
          alt="Buy Reward"
          className="h-6 w-6 object-contain"
        />
      ) : (
        '🔒'
      ),
    disabled:
      deps.isRedeeming ||
      !deps.activeChildId ||
      deps.activeChildStars < reward.costStars,
    variant: 'primary',
    showLabel: false,
    onClick: (item) => deps.handleGiveReward(item),
  }),
})
