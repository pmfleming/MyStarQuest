import { getTaskSuccessImage } from './taskSuccessImage'
import type { ReactNode } from 'react'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
import ImageStarFrame from '../components/ui/ImageStarFrame'
import { getChoreImage } from '../assets/chores/assets'
import { getPresetChoreOverviewImage } from './choreOverviewAssets'
import { uiTokens } from '../tokens'
import { getStandardActionHeadingStyle } from '../components/ui/standardActionStyles'
import {
  shouldHidePresetChoreTitle,
  type ChoreStage,
} from './choreModeDefinitions'
import type { UnifiedChoreState } from './unifiedChoreState'
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

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${Math.max(12, uiTokens.singleVerticalSpace / 2)}px`,
      }}
    >
      {content}
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
  return (
    <h2
      style={{
        ...getStandardActionHeadingStyle(deps.theme),
        margin: 0,
      }}
    >
      {item.title}
    </h2>
  )
}

const renderChoreContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const type = item.taskType
  const overviewImage = getPresetChoreOverviewImage(type, deps.theme.id)
  if (stage === 'setup' && overviewImage) {
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
  if (type === 'standard') return renderStandardContent(deps, item, stage)
  if (type === 'eating') return renderEatingContent(deps, state, item)
  if (type === 'watertoiletcheck') {
    return renderWaterToiletContent(deps, state, item, stage)
  }
  return renderTestContent(deps, state, item)
}

const renderStandardContent = (
  deps: UnifiedChoreDeps,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  if (stage === 'completed') {
    return (
      <ChoreOutcomeView
        imageSrc={getTaskSuccessImage(item, deps.theme)}
        outcome="success"
      />
    )
  }

  const image = getChoreImage(item.imageKey, deps.theme.id)
  return (
    image && (
      <ImageStarFrame
        theme={deps.theme}
        image={image}
        imageAlt={`${item.title} chore`}
        starCount={item.starValue}
      />
    )
  )
}
