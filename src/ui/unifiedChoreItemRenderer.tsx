import type { CSSProperties, ReactNode } from 'react'
import ActionTextInput from '../components/ui/ActionTextInput'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
import Carousel from '../components/ui/Carousel'
import RepeatControl from '../components/ui/RepeatControl'
import StarDisplay from '../components/ui/StarDisplay'
import { princessQuizCorrectImage } from '../assets/themes/princess/assets'
import { choreImageOptions, getChoreImage } from '../assets/chores/assets'
import { uiTokens } from '../tokens'
import { getStandardActionHeadingStyle } from '../components/ui/standardActionStyles'
import {
  shouldHidePresetChoreTitle,
  type ChoreStage,
} from './choreModeDefinitions'
import {
  getChoreType,
  isTaskItem,
  isTestType,
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
  const type = getChoreType(item)
  const content = renderChoreContent(deps, state, item, stage)

  return renderChoreItemContainer(deps, item, stage, type, content)
}

const renderChoreItemContainer = (
  deps: UnifiedChoreDeps,
  item: UnifiedChoreItem,
  stage: ChoreStage,
  type: ReturnType<typeof getChoreType>,
  content: ReactNode
) => {
  const isManage = deps.mode === 'manage'
  const hideTitle = shouldHidePresetChoreTitle(stage)
  const titleLabel = isTestType(type) ? 'Test Name' : 'Chore Name'

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${isManage ? uiTokens.singleVerticalSpace : Math.max(12, uiTokens.singleVerticalSpace / 2)}px`,
      }}
    >
      {!hideTitle && renderTitle(deps, item, titleLabel)}
      {content}
      {isManage &&
        stage === 'setup' &&
        isTaskItem(item) &&
        deps.renderDayTypeControl?.(item)}
    </div>
  )
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
    <div
      style={{
        ...getStandardActionHeadingStyle(deps.theme),
      }}
    >
      {item.title}
    </div>
  )

const renderChoreContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const type = getChoreType(item)
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
          getChoreImage(item.imageKey) ??
          state.princessAsset(princessQuizCorrectImage)
        }
        outcome="success"
      />
    )
  }

  const standardImage = getChoreImage(item.imageKey)
  const showImageCarousel = deps.mode === 'manage' && isTaskItem(item)
  const showImageRewardFrame = Boolean(standardImage && !showImageCarousel)

  return (
    <>
      {showImageCarousel ? (
        <Carousel
          key={`${item.id}-${item.imageKey ?? ''}`}
          items={choreImageOptions.map((option) => ({
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
            choreImageOptions.findIndex((option) => option.id === item.imageKey)
          )}
          onChange={(index) => {
            const selected = choreImageOptions[index]
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
                max={3}
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
) => {
  const frameStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
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
    <div style={frameStyle}>
      <div style={imageLaneStyle}>
        <div style={imageFrameStyle}>
          <img
            src={image}
            alt={`${title} chore`}
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

      <div style={starLaneStyle}>
        <StarDisplay
          count={starValue}
          animate={false}
          style={{
            width: '100%',
            minHeight: '84px',
            padding: '10px 10px 10px 4px',
            background: 'transparent',
            border: '0',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
