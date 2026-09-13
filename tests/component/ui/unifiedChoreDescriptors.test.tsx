import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { themes } from '../../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
import type { TaskWithEphemeral } from '../../../src/data/types'

const createBaseDeps = () => ({
  theme: themes.princess,
  mode: 'today' as const,
  activeIds: {},
  checkTriggers: {},
  biteCooldownSeconds: 15,
})

describe('createUnifiedChoreDescriptor', () => {
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
