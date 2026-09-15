import { act, fireEvent, render, screen } from '@testing-library/react'
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
      fireEvent.change(screen.getByRole('textbox', { name: 'Reward name' }), {
        target: { value: 'Movie night' },
      })
      fireEvent.click(
        screen.getByRole('button', { name: 'Keep available after buying' })
      )
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
        'Movie night'
      )
      await act(async () => fireEvent.click(save))
      expect(onSave).toHaveBeenCalledTimes(2)
      expect(onSave).toHaveBeenLastCalledWith({
        title: 'Movie night',
        costStars: 5,
        isRepeating: false,
        imageKey: '',
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      log.mockRestore()
    }
  })
})
