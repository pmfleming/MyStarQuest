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
  it.each([themes.teenie])(
    'uses the chore picture to start and finish Water/Toilet in $id',
    async (theme) => {
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
        theme,
        onEnterChore,
        onComplete,
      })
      setupDescriptor.getPrimaryAction(task).onClick(task)
      expect(onEnterChore).toHaveBeenCalledWith(task)
      expect(onComplete).not.toHaveBeenCalled()

      const overview = render(<>{setupDescriptor.renderItem(task)}</>)
      const choreImage = screen
        .getByAltText('Water & Toilet Check chore')
        .getAttribute('src')
      overview.unmount()

      const onUpdateEphemeral = vi.fn()
      const activeDescriptor = createUnifiedChoreDescriptor({
        ...createBaseDeps(),
        theme,
        activeIds: { watertoiletcheck: task.id },
        onUpdateEphemeral,
        onComplete,
      })
      const finish = activeDescriptor.getPrimaryAction(task)
      render(
        <>
          {activeDescriptor.renderItem(task)}
          <button
            aria-label={finish.ariaLabel}
            onClick={() => finish.onClick(task)}
          >
            {finish.icon}
          </button>
        </>
      )
      const finishButton = screen.getByRole('button', {
        name: 'Finish Water & Toilet Check',
      })
      expect(finishButton.querySelector('img')).toHaveAttribute(
        'src',
        choreImage
      )
      fireEvent.click(await screen.findByLabelText('Full flask'))
      fireEvent.click(screen.getByLabelText('Has not gone to the toilet'))
      expect(onUpdateEphemeral).toHaveBeenCalledWith('water-1', {
        manageWaterLevel: 'twothirds',
      })
      expect(onUpdateEphemeral).toHaveBeenCalledWith('water-1', {
        manageToiletStatus: 'didpeepee',
      })
      fireEvent.click(finishButton)
      expect(onComplete).toHaveBeenCalledWith(task)
      expect(onEnterChore).toHaveBeenCalledTimes(1)
    }
  )
})
