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
  it('uses an explicit null completion to reset a completed standard chore', () => {
    const task: ChoreRecord = {
      ...baseTask,
      taskType: 'standard',
      manageCompletedAt: 123,
    }

    expect(
      mergeTaskEphemeral(task, { manageCompletedAt: null }).manageCompletedAt
    ).toBeNull()
  })

  it('uses explicit null state to reset a completed dinner', () => {
    const task: ChoreRecord = {
      ...baseTask,
      taskType: 'eating',
      dinnerDurationSeconds: 600,
      dinnerTotalBites: 2,
      manageDinnerTimerStartedAt: 123,
      manageDinnerCompletedAt: 456,
    }

    const merged = mergeTaskEphemeral(task, {
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: null,
    })

    expect(merged.manageDinnerTimerStartedAt).toBeNull()
    expect(merged.manageDinnerCompletedAt).toBeNull()
  })

  it('uses an explicit null completion to reset a water/toilet chore', () => {
    const task: ChoreRecord = {
      ...baseTask,
      taskType: 'watertoiletcheck',
      manageWaterToiletCompletedAt: 123,
    }

    expect(
      mergeTaskEphemeral(task, { manageWaterToiletCompletedAt: null })
        .manageWaterToiletCompletedAt
    ).toBeNull()
  })
})
