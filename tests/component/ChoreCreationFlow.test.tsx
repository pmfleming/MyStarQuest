import { render, screen } from '@testing-library/react'
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
  it('shows a rejected chore save and keeps its draft available for retry', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const user = userEvent.setup()
      const onSave = vi
        .fn()
        .mockRejectedValueOnce(new Error('Offline'))
        .mockResolvedValueOnce(undefined)
      renderFlow({ onSave })
      await user.click(screen.getByRole('button', { name: 'Standard Chore' }))
      await user.click(screen.getByRole('button', { name: 'Next: Tidying up' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSave).toHaveBeenCalledTimes(2)
      expect(onSave).toHaveBeenLastCalledWith(
        'standard',
        expect.objectContaining({
          title: 'New Chore',
          imageKey: 'tidyingUp',
          starValue: 1,
        })
      )
      expect(onSave.mock.calls[1]).toEqual(onSave.mock.calls[0])
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      log.mockRestore()
    }
  })
})
