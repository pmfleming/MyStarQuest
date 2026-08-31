import { describe, expect, it } from 'vitest'
import { mergeTaskEphemeral } from '../../src/data/dailyTaskState'
import type { ChoreRecord } from '../../src/data/types'

const baseTask = {
  id: 'task-1',
  title: 'Task',
  childId: 'child-1',
  category: '',
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  starValue: 1,
  isRepeating: true,
}

describe('mergeTaskEphemeral', () => {
  it('uses explicit null state to reset every chore type', () => {
    const standardTask: ChoreRecord = {
      ...baseTask,
      taskType: 'standard',
      manageCompletedAt: 123,
    }

    expect(
      mergeTaskEphemeral(standardTask, { manageCompletedAt: null })
        .manageCompletedAt
    ).toBeNull()

    const dinnerTask: ChoreRecord = {
      ...baseTask,
      taskType: 'eating',
      dinnerDurationSeconds: 600,
      dinnerTotalBites: 2,
      manageDinnerTimerStartedAt: 123,
      manageDinnerCompletedAt: 456,
    }

    const mergedDinner = mergeTaskEphemeral(dinnerTask, {
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: null,
    })

    expect(mergedDinner.manageDinnerTimerStartedAt).toBeNull()
    expect(mergedDinner.manageDinnerCompletedAt).toBeNull()

    const waterToiletTask: ChoreRecord = {
      ...baseTask,
      taskType: 'watertoiletcheck',
      manageWaterToiletCompletedAt: 123,
    }

    expect(
      mergeTaskEphemeral(waterToiletTask, {
        manageWaterToiletCompletedAt: null,
      }).manageWaterToiletCompletedAt
    ).toBeNull()
  })
})
