import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { themes } from '../../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
import { createUnifiedChoreState } from '../../../src/ui/unifiedChoreState'
import type { TaskWithEphemeral } from '../../../src/data/types'

const createBaseDeps = () => ({
  theme: themes.princess,
  mode: 'today' as const,
  activeIds: {},
  checkTriggers: {},
  biteCooldownSeconds: 15,
})

describe('createUnifiedChoreDescriptor', () => {
  it('keeps dinner in activity stage until the final bite cooldown ends', () => {
    const task: TaskWithEphemeral = {
      id: 'dinner-1',
      title: 'Dinner',
      childId: 'child-1',
      category: 'eating',
      taskType: 'eating',
      starValue: 3,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      isRepeating: true,
      dinnerDurationSeconds: 600,
      dinnerTotalBites: 2,
      manageDinnerCompletedAt: Date.now(),
      manageDinnerBitesLeft: 0,
      manageDinnerRemainingSeconds: 120,
    }
    const deps = {
      ...createBaseDeps(),
      activeIds: { eating: task.id },
      biteCooldownEndsAt: Date.now() + 15_000,
    }
    const primaryAction =
      createUnifiedChoreDescriptor(deps).getPrimaryAction(task)
    expect(primaryAction.hideButton).toBe(false)
    expect(primaryAction.disabled).toBe(true)
    const state = createUnifiedChoreState(deps)
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
    const expired = createUnifiedChoreState({
      ...deps,
      biteCooldownEndsAt: Date.now() - 1,
    })
    expect(expired.getStage(task)).toBe('completed')
  })

  it('wires Water/Toilet start and active tile updates', async () => {
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
      manageWaterLevel: 'full',
      manageToiletStatus: 'notpeepee',
      manageWaterToiletCompletedAt: null,
    }
    const onEnterChore = vi.fn()
    const onComplete = vi.fn()
    const setupDescriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      onEnterChore,
      onComplete,
    })
    setupDescriptor.getPrimaryAction(task).onClick(task)
    expect(onEnterChore).toHaveBeenCalledWith(task)
    expect(onComplete).not.toHaveBeenCalled()

    const onUpdateEphemeral = vi.fn()
    const activeDescriptor = createUnifiedChoreDescriptor({
      ...createBaseDeps(),
      activeIds: { watertoiletcheck: task.id },
      onUpdateEphemeral,
    })
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
