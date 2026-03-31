import { describe, expect, it, vi } from 'vitest'
import { themes } from '../../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
import type { TodoRecord } from '../../../src/data/types'

const createBaseDeps = () => ({
  theme: themes.space,
  mode: 'today' as const,
  activeMathId: null,
  activePVId: null,
  activeAlphabetId: null,
  activeDinnerId: null,
  activeWaterToiletId: null,
  mathCheckTriggers: {},
  pvCheckTriggers: {},
  alphabetCheckTriggers: {},
  biteCooldownSeconds: 15,
})

describe('createUnifiedChoreDescriptor', () => {
  it('uses enter-chore wiring for preset test start actions', () => {
    const onEnterChore = vi.fn()
    const onComplete = vi.fn()
    const descriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      onEnterChore,
      onComplete,
    })

    const todo: TodoRecord = {
      id: 'math-1',
      title: 'Arithmetic',
      childId: 'child-1',
      sourceTaskId: 'task-1',
      sourceTaskType: 'math',
      starValue: 3,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      autoAdded: false,
      completedAt: null,
      dateKey: '2026-03-23',
      mathTotalProblems: 5,
      mathDifficulty: 'easy',
      mathLastOutcome: null,
    }

    descriptor.getPrimaryAction(todo).onClick(todo)

    expect(onEnterChore).toHaveBeenCalledWith(todo)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('keeps dinner in activity stage until the final bite cooldown ends', () => {
    const futureCooldown = Date.now() + 15_000
    const descriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      activeDinnerId: 'dinner-1',
      biteCooldownEndsAt: futureCooldown,
    })

    const todo: TodoRecord = {
      id: 'dinner-1',
      title: 'Dinner',
      childId: 'child-1',
      sourceTaskId: 'task-2',
      sourceTaskType: 'eating',
      starValue: 3,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      autoAdded: false,
      completedAt: Date.now(),
      dateKey: '2026-03-23',
      dinnerDurationSeconds: 600,
      dinnerRemainingSeconds: 120,
      dinnerTotalBites: 2,
      dinnerBitesLeft: 0,
      dinnerTimerStartedAt: null,
    }

    const primaryAction = descriptor.getPrimaryAction(todo)

    expect(primaryAction.hideButton).toBe(false)
    expect(primaryAction.disabled).toBe(true)
  })

  it('uses enter-chore wiring for Water/Toilet start action on dashboard todos', () => {
    const onEnterChore = vi.fn()
    const onComplete = vi.fn()
    const descriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      onEnterChore,
      onComplete,
    })

    const todo: TodoRecord = {
      id: 'water-1',
      title: 'Water & Toilet Check',
      childId: 'child-1',
      sourceTaskId: 'task-3',
      sourceTaskType: 'watertoiletcheck',
      starValue: 0,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: false,
      autoAdded: false,
      completedAt: null,
      dateKey: '2026-03-23',
      waterLevel: 'full',
      toiletStatus: 'notpeepee',
    }

    descriptor.getPrimaryAction(todo).onClick(todo)

    expect(onEnterChore).toHaveBeenCalledWith(todo)
    expect(onComplete).not.toHaveBeenCalled()
  })
})
