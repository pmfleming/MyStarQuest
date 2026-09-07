import { getThemeAsset } from './themeAssets'
import type { ReactNode } from 'react'
import ActionTextInput from '../components/ui/ActionTextInput'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
import Carousel from '../components/ui/Carousel'
import RepeatControl from '../components/ui/RepeatControl'
import StarDisplay from '../components/ui/StarDisplay'
import ImageStarFrame from '../components/ui/ImageStarFrame'
import { getChoreImageOptions, getChoreImage } from '../assets/chores/assets'
import { getPresetChoreOverviewImage } from './choreOverviewAssets'
import { isTestType } from '../data/types'
import { uiTokens } from '../tokens'
import { getStandardActionHeadingStyle } from '../components/ui/standardActionStyles'
import {
  shouldHidePresetChoreTitle,
  type ChoreStage,
} from './choreModeDefinitions'
import {
  getChoreType,
  isTaskItem,
  type UnifiedChoreState,
} from './unifiedChoreState'
import { renderEatingContent } from './unifiedEatingRenderer'
import { renderTestContent } from './unifiedTestRenderer'
import { renderWaterToiletContent } from './unifiedWaterToiletRenderer'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'

export const renderUnifiedChoreItem = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem
): ReactNode => {
  const stage = state.getStage(item)
  const content = renderChoreContent(deps, state, item, stage)
  const isManage = deps.mode === 'manage'

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${isManage ? uiTokens.singleVerticalSpace : Math.max(12, uiTokens.singleVerticalSpace / 2)}px`,
      }}
    >
      {content}
      {isManage &&
        stage === 'setup' &&
        isTaskItem(item) &&
        deps.renderDayTypeControl?.(item)}
    </div>
  )
}

export const renderUnifiedChoreHeader = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem
): ReactNode => {
  const stage = state.getStage(item)
  if (shouldHidePresetChoreTitle(stage)) return null
  const type = getChoreType(item)
  const titleLabel = isTestType(type) ? 'Test Name' : 'Chore Name'
  return renderTitle(deps, item, titleLabel)
}

const renderTitle = (
  deps: UnifiedChoreDeps,
  item: UnifiedChoreItem,
  titleLabel: string
) =>
  deps.mode === 'manage' ? (
    <ActionTextInput
      theme={deps.theme}
      label={titleLabel}
      value={deps.titleDrafts?.[item.id] ?? item.title}
      onChange={(value) => deps.onSetTitleDraft?.(item.id, value)}
      onCommit={(value) => deps.onCommitTitle?.(item.id, value)}
      maxLength={80}
      baseColor={deps.theme.colors.primary}
      inputAriaLabel={titleLabel}
      transparent
    />
  ) : (
    <h2
      style={{
        ...getStandardActionHeadingStyle(deps.theme),
        margin: 0,
      }}
    >
      {item.title}
    </h2>
  )

const renderChoreContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const type = getChoreType(item)
  const overviewImage = getPresetChoreOverviewImage(type, deps.theme.id)
  if (deps.mode === 'today' && stage === 'setup' && overviewImage) {
    return (
      <ImageStarFrame
        theme={deps.theme}
        image={overviewImage}
        imageAlt={`${item.title} chore`}
        starCount={
          type === 'watertoiletcheck'
            ? state.getWaterToiletDelta(item)
            : item.starValue
        }
      />
    )
  }
  if (type === 'standard')
    return renderStandardContent(deps, state, item, stage)
  if (type === 'eating') return renderEatingContent(deps, state, item, stage)
  if (type === 'watertoiletcheck') {
    return renderWaterToiletContent(deps, state, item, stage)
  }
  return renderTestContent(deps, state, item, stage)
}

const renderStandardContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  if (stage === 'completed') {
    return (
      <ChoreOutcomeView
        imageSrc={
          getChoreImage(item.imageKey, deps.theme.id) ??
          state.themedAsset(getThemeAsset(deps.theme.id, 'quizCorrectImage'))
        }
        outcome="success"
      />
    )
  }

  const standardImage = getChoreImage(item.imageKey, deps.theme.id)
  const showImageCarousel = deps.mode === 'manage' && isTaskItem(item)
  const showImageRewardFrame = Boolean(standardImage && !showImageCarousel)

  return (
    <>
      {showImageCarousel ? (
        <Carousel
          key={`${item.id}-${item.imageKey ?? ''}`}
          items={getChoreImageOptions(deps.theme.id).map((option) => ({
            id: option.id,
            label: option.label,
            icon: option.image ? (
              <img
                src={option.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
                aria-hidden="true"
              />
            ) : (
              <span
                aria-hidden="true"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 14,
                  border: `3px dashed ${deps.theme.colors.primary}`,
                  display: 'block',
                  opacity: 0.55,
                }}
              />
            ),
          }))}
          title="Chore image"
          initialIndex={Math.max(
            0,
            getChoreImageOptions(deps.theme.id).findIndex(
              (option) => option.id === item.imageKey
            )
          )}
          onChange={(index) => {
            const selected = getChoreImageOptions(deps.theme.id)[index]
            if (!selected || selected.id === item.imageKey) return
            deps.onUpdateTaskField?.(item.id, { imageKey: selected.id })
          }}
        />
      ) : (
        standardImage &&
        renderStandardChoreImageRewardFrame(
          standardImage,
          item.title,
          item.starValue,
          deps.theme
        )
      )}

      {deps.mode === 'manage' && isTaskItem(item) && (
        <>
          <div className="flex flex-col items-center" style={{ gap: '0px' }}>
            <RepeatControl
              theme={deps.theme}
              value={item.isRepeating}
              onChange={(value) =>
                deps.onUpdateTaskField?.(item.id, { isRepeating: value })
              }
              showLabel={false}
              showFeedback={false}
            />
          </div>
          {!showImageRewardFrame && (
            <div className="flex flex-col items-center" style={{ gap: '0px' }}>
              <StarDisplay
                theme={deps.theme}
                count={item.starValue}
                editable
                onChange={(value) =>
                  deps.onUpdateTaskField?.(item.id, { starValue: value || 1 })
                }
                min={1}
                max={9}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}

const renderStandardChoreImageRewardFrame = (
  image: string,
  title: string,
  starValue: number,
  theme: UnifiedChoreDeps['theme']
) => (
  <ImageStarFrame
    theme={theme}
    image={image}
    imageAlt={`${title} chore`}
    starCount={starValue}
  />
)
