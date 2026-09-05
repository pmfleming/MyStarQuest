import { describe, expect, it } from 'vitest'
import {
  mergeTaskEphemeral,
  mergeTestEphemeral,
} from '../../src/data/dailyTaskState'
import { buildDefaultTests } from '../../src/data/taskDocuments'
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
  it('preserves stored values for undefined overrides and ignores unrelated fields', () => {
    const task: ChoreRecord = {
      ...baseTask,
      taskType: 'eating',
      dinnerDurationSeconds: 600,
      dinnerTotalBites: 2,
      manageDinnerBitesLeft: 1,
      manageDinnerCompletedAt: 123,
    }
    expect(
      mergeTaskEphemeral(task, {
        manageDinnerBitesLeft: 0,
        manageDinnerCompletedAt: undefined,
        manageMathCompletedAt: 456,
      })
    ).toEqual({
      ...task,
      manageDinnerBitesLeft: 0,
      manageDinnerRemainingSeconds: undefined,
      manageDinnerTimerStartedAt: undefined,
    })
  })

  it.each([
    ['math', 'manageMathCompletedAt', 'manageMathLastOutcome'],
    ['positional-notation', 'managePVCompletedAt', 'managePVLastOutcome'],
  ])('scopes %s state to its outcome fields', (type, completedAt, outcome) => {
    const task = buildDefaultTests('child-1').find(
      (test) => test.taskType === type
    )!
    const state = { [completedAt]: 123, [outcome]: 'failure' }
    expect(
      mergeTaskEphemeral(task, { ...state, manageCompletedAt: 999 })
    ).toEqual({ ...task, ...state })
    expect(mergeTestEphemeral({ ...task, ...state })).toEqual({
      ...task,
      [completedAt]: undefined,
      [outcome]: undefined,
    })
    expect(
      mergeTestEphemeral(task, { [completedAt]: null, [outcome]: null })
    ).toEqual({ ...task, [completedAt]: null, [outcome]: null })
  })

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
