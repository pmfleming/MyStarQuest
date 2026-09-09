import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RewardCreationFlow from '../../src/pages/RewardCreationFlow'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'

const renderFlow = ({
  onSave = vi.fn(),
  onCancel = vi.fn(),
}: {
  onSave?: ReturnType<typeof vi.fn>
  onCancel?: ReturnType<typeof vi.fn>
} = {}) => {
  render(
    <ThemeContext.Provider
      value={{
        theme: themes.princess,
        currentTheme: 'princess',
        setTheme: vi.fn(),
      }}
    >
      <RewardCreationFlow
        theme={themes.princess}
        isSaving={false}
        onSave={onSave}
        onCancel={onCancel}
      />
    </ThemeContext.Provider>
  )

  return { onSave, onCancel }
}

describe('RewardCreationFlow', () => {
  it('keeps the draft after a rejected save and blocks duplicate actions until retry', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      let reject!: (error: Error) => void
      const onSave = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((_resolve, fail) => {
              reject = fail
            })
        )
        .mockResolvedValueOnce(undefined)
      renderFlow({ onSave })
      const save = screen.getByRole('button', { name: 'Save reward' })
      fireEvent.click(save)
      fireEvent.click(save)
      expect(onSave).toHaveBeenCalledOnce()
      expect(save).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'Discard reward' })
      ).toBeDisabled()
      await act(async () => reject(new Error('Offline')))
      expect(screen.getByRole('alert')).toHaveTextContent('Save reward failed')
      expect(screen.getByRole('textbox', { name: 'Reward name' })).toHaveValue(
        'New Reward'
      )
      await act(async () => fireEvent.click(save))
      expect(onSave).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      log.mockRestore()
    }
  })

  it('saves the staged reward draft', async () => {
    const user = userEvent.setup()
    const { onSave } = renderFlow()

    await user.clear(screen.getByRole('textbox', { name: 'Reward name' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Reward name' }),
      'Movie night'
    )
    await user.click(
      screen.getByRole('button', { name: 'Keep available after buying' })
    )
    await user.click(screen.getByRole('button', { name: 'Save reward' }))

    expect(onSave).toHaveBeenCalledWith({
      title: 'Movie night',
      costStars: 5,
      isRepeating: false,
      imageKey: '',
    })
  })

  it('selects image artwork and discards a separate staged draft', async () => {
    const user = userEvent.setup()
    const { onSave } = renderFlow()

    await user.click(screen.getByRole('button', { name: 'Previous: Pikachu' }))
    expect(screen.getByLabelText('Selected: Pikachu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save reward' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ imageKey: 'pikachu' })
    )

    cleanup()
    const { onCancel, onSave: cancelledSave } = renderFlow()

    const discardButton = screen.getByRole('button', { name: 'Discard reward' })
    await user.click(discardButton)

    expect(onCancel).toHaveBeenCalledOnce()
    expect(cancelledSave).not.toHaveBeenCalled()
  })
})
