import { getThemeAsset } from './themeAssets'
import type { ReactNode } from 'react'
import Carousel from '../components/ui/Carousel'
import ActionTextInput from '../components/ui/ActionTextInput'
import StarDisplay from '../components/ui/StarDisplay'
import ImageStarFrame from '../components/ui/ImageStarFrame'
import SegmentedChoiceControl, {
  type SegmentedChoiceOption,
} from '../components/ui/SegmentedChoiceControl'
import { getStandardActionHeadingStyle } from '../components/ui/standardActionStyles'
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

const getTestFailureModeOptions = (
  themeId: ThemeId
): SegmentedChoiceOption<TestFailureModeChoice>[] => [
  {
    value: 'failure',
    label: 'Tests have failure mode',
    icon: getThemeAsset(themeId, 'quizIncorrectImage'),
  },
  {
    value: 'success',
    label: 'Tests do not have failure mode',
    icon: getThemeAsset(themeId, 'quizCorrectImage'),
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

  return (
    <div
      aria-label={`${reward.title} available reward`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        flex: 1,
      }}
    >
      <ImageStarFrame
        theme={theme}
        image={image}
        imageAlt={`${reward.title} reward`}
        starCount={reward.costStars}
      />
    </div>
  )
}

export const createChildDefinitionListRowDescriptor = (
  deps: ChildDefinitionDescriptorDeps
): ListRowDescriptor<ChildProfile> => ({
  renderHeader: (child) => (
    <div
      className="flex flex-col"
      style={{ gap: `${uiTokens.controlColumnGap}px` }}
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
      {deps.activeChildId === child.id && (
        <span style={{ fontFamily: deps.theme.fonts.body, fontWeight: 700 }}>
          Active
        </span>
      )}
    </div>
  ),
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
          options={getTestFailureModeOptions(deps.theme.id)}
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
    label: 'Select',
    ariaLabel: `Select ${child.displayName}`,
    icon:
      deps.theme.id === 'princess' || deps.theme.id === 'teenie' ? (
        <img
          src={
            deps.activeChildId === child.id
              ? getThemeAsset(deps.theme.id, 'activeIcon')
              : getThemeAsset(deps.theme.id, 'selectIcon')
          }
          data-artwork-fit={
            deps.theme.id === 'teenie' && deps.activeChildId === child.id
              ? 'contain'
              : undefined
          }
          alt=""
          aria-hidden="true"
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
    variant:
      deps.theme.id === 'princess' || deps.theme.id === 'teenie'
        ? 'neutral'
        : 'primary',
    onClick: (item) => deps.selectChild(item.id),
  }),
})

export const createRewardDefinitionListRowDescriptor = (
  deps: RewardDefinitionDescriptorDeps
): ListRowDescriptor<RewardRecord> => ({
  renderHeader: (reward) => (
    <h2
      style={{
        ...getStandardActionHeadingStyle(deps.theme),
        margin: 0,
      }}
    >
      {reward.title}
    </h2>
  ),
  renderItem: (reward) => renderRewardAvailableSummary(reward, deps.theme),
  getPrimaryAction: (reward) => {
    const hasEnoughStars = deps.activeChildStars >= reward.costStars

    return {
      label: 'Buy reward',
      ariaLabel: `Buy ${reward.title}`,
      icon: hasEnoughStars ? (
        <img
          src={getThemeAsset(deps.theme.id, 'buyRewardIcon')}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="h-6 w-6 object-contain"
        />
      ) : (
        <img
          src={getThemeAsset(deps.theme.id, 'lockedRewardIcon')}
          alt=""
          aria-hidden="true"
          decoding="async"
          style={{
            width: 22,
            height: 22,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ),
      disabled: deps.isRedeeming || !deps.activeChildId || !hasEnoughStars,
      variant: 'primary',
      showLabel: false,
      onClick: (item) => deps.handleGiveReward(item),
    }
  },
})
