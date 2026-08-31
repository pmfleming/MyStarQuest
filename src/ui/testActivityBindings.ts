import type { useTests } from '../data/useTests'
import { BITE_COOLDOWN_SECONDS, isTestWithEphemeral } from '../data/types'
import type { useTaskActivityState } from '../hooks/useTaskActivityState'
import type { TestCheckTriggers } from '../hooks/useTestCheckTriggers'
import type { UnifiedChoreItem } from './unifiedChoreDescriptorTypes'

type TestActions = Pick<
  ReturnType<typeof useTests>,
  'completeTest' | 'failTest' | 'resetTest'
>

type TestActivityBindingsArgs = TestActions & {
  activity: ReturnType<typeof useTaskActivityState>
  triggers: TestCheckTriggers
}

export const createTestActivityBindings = ({
  activity,
  triggers,
  completeTest,
  failTest,
  resetTest,
}: TestActivityBindingsArgs) => ({
  onEnterChore: (item: UnifiedChoreItem) => {
    if (isTestWithEphemeral(item)) {
      activity.enterActivity(item.taskType, item.id)
    }
  },
  onExitActivity: activity.clearActiveActivities,
  onComplete: (item: UnifiedChoreItem) =>
    isTestWithEphemeral(item) ? completeTest(item) : undefined,
  onFail: (item: UnifiedChoreItem) =>
    isTestWithEphemeral(item) ? failTest(item) : undefined,
  onReset: async (item: UnifiedChoreItem) => {
    if (!isTestWithEphemeral(item)) return
    await resetTest(item)
    activity.clearActiveActivities()
  },
  activeMathId: activity.activeMathId,
  activeLargeNumbersId: activity.activeLargeNumbersId,
  activePVId: activity.activePVId,
  activeAlphabetId: activity.activeAlphabetId,
  activeSpellingId: activity.activeSpellingId,
  activeAnimalsId: activity.activeAnimalsId,
  activeDinnerId: null,
  activeWaterToiletId: null,
  mathCheckTriggers: triggers.mathCheckTriggers,
  largeNumbersCheckTriggers: triggers.largeNumbersCheckTriggers,
  pvCheckTriggers: triggers.pvCheckTriggers,
  alphabetCheckTriggers: triggers.alphabetCheckTriggers,
  spellingCheckTriggers: triggers.spellingCheckTriggers,
  animalsCheckTriggers: triggers.animalsCheckTriggers,
  setMathCheckTriggers: triggers.setMathCheckTriggers,
  setLargeNumbersCheckTriggers: triggers.setLargeNumbersCheckTriggers,
  setPVCheckTriggers: triggers.setPVCheckTriggers,
  setAlphabetCheckTriggers: triggers.setAlphabetCheckTriggers,
  setSpellingCheckTriggers: triggers.setSpellingCheckTriggers,
  setAnimalsCheckTriggers: triggers.setAnimalsCheckTriggers,
  biteCooldownSeconds: BITE_COOLDOWN_SECONDS,
})
