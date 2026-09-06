import ChoreOutcomeView from '../components/ChoreOutcomeView'
import { getWaterToiletOutcome } from '../lib/choreLogic'
import type { ChoreStage } from './choreModeDefinitions'
import { renderWaterToiletChore } from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import type { UnifiedChoreState } from './unifiedChoreState'
import { getWaterToiletOutcomeImage } from './waterToiletAssets'

export const renderWaterToiletContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const renderState = state.getWaterToiletRenderState(item)
  if (!renderState) return null

  if (stage === 'completed') {
    const outcome = getWaterToiletOutcome(
      renderState.waterLevel,
      renderState.toiletStatus
    )
    return (
      <ChoreOutcomeView
        imageSrc={getWaterToiletOutcomeImage(deps.theme, outcome)}
        outcome={outcome}
      />
    )
  }

  if (deps.activeIds.watertoiletcheck !== item.id) return null

  return renderWaterToiletChore({
    theme: deps.theme,
    waterLevel: renderState.waterLevel,
    toiletStatus: renderState.toiletStatus,
    starDelta: renderState.starDelta,
    isInteractive: true,
    isCompleted: false,
    onCycleWater: renderState.onCycleWater,
    onCycleToilet: renderState.onCycleToilet,
  })
}
