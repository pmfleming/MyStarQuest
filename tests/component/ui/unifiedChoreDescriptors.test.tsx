import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { themes } from '../../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
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

    expect(descriptor.getPrimaryAction(todo)).toMatchObject({
      label: 'Run',
      ariaLabel: 'Run Arithmetic',
      showLabel: false,
    })
    expect(onEnterChore).toHaveBeenCalledWith(todo)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('standardizes Check result and item-specific reset accessibility names', () => {
    const descriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      activeMathId: 'math-1',
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

    expect(descriptor.getPrimaryAction(todo)).toMatchObject({
      label: 'Check result',
      ariaLabel: 'Check result Arithmetic',
      showLabel: false,
    })
    expect(descriptor.getUtilityAction?.(todo)).toMatchObject({
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

  it('updates active Water/Toilet dashboard task state from the tiles', async () => {
    const onUpdateEphemeral = vi.fn()
    const descriptor = createUnifiedChoreDescriptor({
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

    render(<>{descriptor.renderItem(task)}</>)

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
