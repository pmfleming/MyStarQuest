import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { themes } from '../../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
import { createUnifiedChoreState } from '../../../src/ui/unifiedChoreState'
import type { TaskWithEphemeral, TodoRecord } from '../../../src/data/types'

const createBaseDeps = () => ({
  theme: themes.space,
  mode: 'today' as const,
  activeMathId: null,
  activeLargeNumbersId: null,
  activePVId: null,
  activeAlphabetId: null,
  activeSpellingId: null,
  activeAnimalsId: null,
  activeDinnerId: null,
  activeWaterToiletId: null,
  mathCheckTriggers: {},
  largeNumbersCheckTriggers: {},
  pvCheckTriggers: {},
  alphabetCheckTriggers: {},
  spellingCheckTriggers: {},
  animalsCheckTriggers: {},
  biteCooldownSeconds: 15,
})

describe('createUnifiedChoreDescriptor', () => {
  it('does not add a duplicate list star field for standard chores with images', () => {
    const descriptor = createUnifiedChoreDescriptor(createBaseDeps())

    const choreWithImage: TodoRecord = {
      id: 'writing-1',
      title: 'Writing',
      childId: 'child-1',
      sourceTaskId: 'task-1',
      sourceTaskType: 'standard',
      starValue: 2,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      autoAdded: false,
      completedAt: null,
      dateKey: '2026-03-23',
      imageKey: 'writing',
    }
    const choreWithoutImage: TodoRecord = {
      ...choreWithImage,
      id: 'plain-1',
      title: 'Plain Chore',
      imageKey: undefined,
    }

    expect(descriptor.getStarCount?.(choreWithImage)).toBeUndefined()
    expect(descriptor.getStarCount?.(choreWithoutImage)).toBe(2)
  })

  it('wires preset test start, check, and reset actions', () => {
    const onEnterChore = vi.fn()
    const onComplete = vi.fn()
    const setupDescriptor = createUnifiedChoreDescriptor({
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

    setupDescriptor.getPrimaryAction(todo).onClick(todo)

    expect(setupDescriptor.getPrimaryAction(todo)).toMatchObject({
      label: 'Run',
      ariaLabel: 'Run Arithmetic',
      showLabel: false,
    })
    expect(onEnterChore).toHaveBeenCalledWith(todo)
    expect(onComplete).not.toHaveBeenCalled()

    const activeDescriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      activeMathId: 'math-1',
    })

    expect(activeDescriptor.getPrimaryAction(todo)).toMatchObject({
      label: 'Check result',
      ariaLabel: 'Check result Arithmetic',
      showLabel: false,
    })
    expect(activeDescriptor.getUtilityAction?.(todo)).toMatchObject({
      label: 'Reset',
      ariaLabel: 'Reset Arithmetic',
      variant: 'neutral',
      exits: false,
    })
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

    const state = createUnifiedChoreState({
      ...createBaseDeps(),
      activeDinnerId: todo.id,
      biteCooldownEndsAt: futureCooldown,
    })
    const task: TaskWithEphemeral = {
      id: todo.id,
      title: todo.title,
      childId: todo.childId,
      category: 'eating',
      taskType: 'eating',
      starValue: 3,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      isRepeating: true,
      dinnerDurationSeconds: 600,
      dinnerTotalBites: 2,
      manageDinnerCompletedAt: todo.completedAt,
      manageDinnerBitesLeft: 0,
      manageDinnerRemainingSeconds: 120,
    }
    expect(state.getStage(task)).toBe('activity')
    expect(state.getStage({ ...task, manageDinnerBitesLeft: 1 })).toBe(
      'completed'
    )
    expect(
      state.getStage({
        ...task,
        manageDinnerCompletedAt: null,
        manageDinnerBitesLeft: 1,
        manageDinnerTimerStartedAt: Date.now() - 121_000,
      })
    ).toBe('completed')
    expect(
      state.getStage({
        ...todo,
        completedAt: null,
        dinnerBitesLeft: 1,
        dinnerTimerStartedAt: Date.now() - 121_000,
      })
    ).toBe('completed')
    const expired = createUnifiedChoreState({
      ...createBaseDeps(),
      activeDinnerId: todo.id,
      biteCooldownEndsAt: Date.now() - 1,
    })
    expect(expired.getStage(task)).toBe('completed')
    expect(expired.getStage(todo)).toBe('completed')
  })

  it('wires Water/Toilet start and active tile updates', async () => {
    const onEnterChore = vi.fn()
    const onComplete = vi.fn()
    const setupDescriptor = createUnifiedChoreDescriptor({
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

    setupDescriptor.getPrimaryAction(todo).onClick(todo)

    expect(onEnterChore).toHaveBeenCalledWith(todo)
    expect(onComplete).not.toHaveBeenCalled()

    const onUpdateEphemeral = vi.fn()
    const activeDescriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      activeWaterToiletId: 'water-1',
      onUpdateEphemeral,
    })

    const task: TaskWithEphemeral = {
      id: 'water-1',
      title: 'Water & Toilet Check',
      childId: 'child-1',
      category: 'watertoiletcheck',
      taskType: 'watertoiletcheck',
      starValue: 0,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: false,
      isRepeating: true,
      waterLevel: 'full',
      toiletStatus: 'notpeepee',
      manageWaterLevel: 'full',
      manageToiletStatus: 'notpeepee',
      manageWaterToiletCompletedAt: null,
    }

    render(<>{activeDescriptor.renderItem(task)}</>)

    fireEvent.click(await screen.findByLabelText('Full flask'))
    fireEvent.click(screen.getByLabelText('Has not gone to the toilet'))

    expect(onUpdateEphemeral).toHaveBeenCalledWith('water-1', {
      manageWaterLevel: 'twothirds',
    })
    expect(onUpdateEphemeral).toHaveBeenCalledWith('water-1', {
      manageToiletStatus: 'didpeepee',
    })
  })
})
