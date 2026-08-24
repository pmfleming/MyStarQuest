import type { CSSProperties, ReactNode } from 'react'
import Carousel from '../components/ui/Carousel'
import ActionTextInput from '../components/ui/ActionTextInput'
import StarDisplay from '../components/ui/StarDisplay'
import SegmentedChoiceControl, {
  type SegmentedChoiceOption,
} from '../components/ui/SegmentedChoiceControl'
import { getStandardActionHeadingStyle } from '../components/ui/standardActionStyles'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import {
  princessActiveIcon,
  princessBuyRewardIcon,
  princessSelectIcon,
} from '../assets/themes/princess/assets'
import { getRewardImage } from '../assets/rewards/assets'
import type { ThemeId } from './themeOptions'
import type { Theme } from '../contexts/ThemeContext'
import type { ChildProfile, RewardRecord } from '../data/types'
import { uiTokens } from '../tokens'
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

type TestFailureModeChoice = 'failure' | 'success'

const TEST_FAILURE_MODE_OPTIONS: SegmentedChoiceOption<TestFailureModeChoice>[] =
  [
    {
      value: 'failure',
      label: 'Tests have failure mode',
      icon: quizIncorrectIcon,
    },
    {
      value: 'success',
      label: 'Tests do not have failure mode',
      icon: quizCorrectIcon,
    },
  ]

type RewardDefinitionDescriptorDeps = {
  theme: Theme
  activeChildId: string | null
  activeChildStars: number
  isRedeeming: boolean
  handleGiveReward: (reward: RewardRecord) => void | Promise<void>
}

const renderRewardAvailableSummary = (reward: RewardRecord, theme: Theme) => {
  const image = getRewardImage(reward.imageKey)

  const rewardCostFrameStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    minHeight: '116px',
    padding: '10px',
    borderRadius: `${uiTokens.surfaceRadius}px`,
    border: `3px dashed ${theme.colors.primary}55`,
    background: `${theme.colors.bg}88`,
    overflow: 'visible',
    boxSizing: 'border-box',
  }

  const imageLaneStyle: CSSProperties = {
    flex: '0 0 38%',
    minWidth: '96px',
    maxWidth: '152px',
    marginRight: '-26px',
    position: 'relative',
    zIndex: 2,
  }

  const imageFrameStyle: CSSProperties = {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  }

  const starLaneStyle: CSSProperties = {
    flex: '1 1 66%',
    minWidth: 0,
    position: 'relative',
    zIndex: 1,
  }

  return (
    <div
      aria-label={`${reward.title} available reward`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${uiTokens.singleVerticalSpace}px`,
        minWidth: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          ...getStandardActionHeadingStyle(theme),
        }}
      >
        {reward.title}
      </div>

      <div style={rewardCostFrameStyle}>
        {image && (
          <div style={imageLaneStyle}>
            <div style={imageFrameStyle}>
              <img
                src={image}
                alt={`${reward.title} reward`}
                loading="lazy"
                decoding="async"
                style={{
                  width: '112%',
                  height: '112%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>
        )}

        <div style={starLaneStyle}>
          <StarDisplay
            count={reward.costStars}
            animate={false}
            style={{
              width: '100%',
              minHeight: '84px',
              padding: image ? '10px 10px 10px 4px' : '10px',
              background: 'transparent',
              border: '0',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  )
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

        <SegmentedChoiceControl
          theme={deps.theme}
          value={child.testFailureModeEnabled ? 'failure' : 'success'}
          options={TEST_FAILURE_MODE_OPTIONS}
          onChange={(value) =>
            deps.updateChildField(child.id, {
              testFailureModeEnabled: value === 'failure',
            })
          }
          ariaLabel="Test failure mode"
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
          decoding="async"
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
  renderItem: (reward) => renderRewardAvailableSummary(reward, deps.theme),
  getPrimaryAction: (reward) => {
    const hasEnoughStars = deps.activeChildStars >= reward.costStars

    return {
      label: hasEnoughStars ? 'Buy Reward' : 'Need Stars',
      icon: hasEnoughStars ? (
        <img
          src={princessBuyRewardIcon}
          alt="Buy Reward"
          decoding="async"
          className="h-6 w-6 object-contain"
        />
      ) : (
        '🔒'
      ),
      disabled: deps.isRedeeming || !deps.activeChildId || !hasEnoughStars,
      variant: 'primary',
      showLabel: false,
      onClick: (item) => deps.handleGiveReward(item),
    }
  },
})
