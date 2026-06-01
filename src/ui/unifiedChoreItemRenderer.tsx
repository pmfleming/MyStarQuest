import type { ReactNode } from 'react'
import ActionTextInput from '../components/ui/ActionTextInput'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
import RepeatControl from '../components/ui/RepeatControl'
import StarDisplay from '../components/ui/StarDisplay'
import { princessQuizCorrectImage } from '../assets/themes/princess/assets'
import { uiTokens } from '../tokens'
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
        fontFamily: deps.theme.fonts.heading,
        fontSize: '1.25rem',
        fontWeight: 800,
        lineHeight: 1.2,
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
        imageSrc={state.princessAsset(princessQuizCorrectImage)}
        outcome="success"
      />
    )
  }

  return isTaskItem(item) ? (
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
    </>
  ) : null
}
