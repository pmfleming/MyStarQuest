import { cleanup, render, screen } from '@testing-library/react'
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
  it('orders the fields and saves the staged reward draft', async () => {
    const user = userEvent.setup()
    const { onSave } = renderFlow()

    const titleInput = screen.getByRole('textbox', { name: 'Reward name' })
    const selectedImage = screen.getByLabelText('Selected: No image')
    const starControl = screen.getByLabelText('Decrease star value')

    expect(
      titleInput.compareDocumentPosition(selectedImage) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      selectedImage.compareDocumentPosition(starControl) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

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
    const { onCancel } = renderFlow()

    const discardButton = screen.getByRole('button', { name: 'Discard reward' })
    expect(discardButton.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('exit-princess.png')
    )

    await user.click(discardButton)

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
