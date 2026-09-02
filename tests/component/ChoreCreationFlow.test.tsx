import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChoreCreationFlow from '../../src/pages/ChoreCreationFlow'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import type { ChoreWithEphemeral } from '../../src/data/types'

const renderFlow = ({
  onSave = vi.fn(),
  onCancel = vi.fn(),
  initialChore,
}: {
  onSave?: ReturnType<typeof vi.fn>
  onCancel?: ReturnType<typeof vi.fn>
  initialChore?: ChoreWithEphemeral
} = {}) => {
  render(
    <ThemeContext.Provider
      value={{
        theme: themes.princess,
        currentTheme: 'princess',
        setTheme: vi.fn(),
      }}
    >
      <ChoreCreationFlow
        theme={themes.princess}
        isSaving={false}
        onSave={onSave}
        onCancel={onCancel}
        initialChore={initialChore}
      />
    </ThemeContext.Provider>
  )

  return { onSave, onCancel }
}

describe('ChoreCreationFlow', () => {
  it('saves a standard chore with the selected image', async () => {
    const user = userEvent.setup()
    const { onSave } = renderFlow()

    await user.click(screen.getByRole('button', { name: 'Standard Chore' }))
    await user.click(screen.getByRole('button', { name: 'Next: Tidying up' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Selected: Tidying up')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()

    await user.click(saveButton)

    expect(onSave).toHaveBeenCalledWith(
      'standard',
      expect.objectContaining({
        title: 'New Chore',
        imageKey: 'tidyingUp',
        starValue: 1,
      })
    )
  })

  it('edits an existing standard chore through the creation controls', async () => {
    const user = userEvent.setup()
    const { onSave } = renderFlow({
      initialChore: {
        id: 'chore-1',
        title: 'Writing',
        childId: 'child-1',
        category: '',
        taskType: 'standard',
        schoolDayEnabled: true,
        nonSchoolDayEnabled: false,
        starValue: 2,
        isRepeating: true,
        imageKey: 'writing',
      },
    })

    expect(
      screen.queryByRole('button', { name: 'Standard Chore' })
    ).not.toBeInTheDocument()

    const nameInput = screen.getByLabelText('Chore name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Reading')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      'standard',
      expect.objectContaining({
        title: 'Reading',
        imageKey: 'writing',
        starValue: 2,
        nonSchoolDayEnabled: false,
      })
    )
  })
})
