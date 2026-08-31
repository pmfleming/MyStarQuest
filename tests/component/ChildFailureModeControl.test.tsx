import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { themes } from '../../src/contexts/ThemeContext'
import type { ChildProfile } from '../../src/data/types'
import { createChildDefinitionListRowDescriptor } from '../../src/ui/definitionRowDescriptors'

const child: ChildProfile = {
  id: 'child-1',
  displayName: 'Ada',
  avatarToken: 'ada',
  totalStars: 12,
  themeId: 'princess',
  testFailureModeEnabled: true,
}

const renderDescriptor = (
  overrides: Partial<ChildProfile> = {},
  updateChildField = vi.fn()
) => {
  const descriptor = createChildDefinitionListRowDescriptor({
    theme: themes.princess,
    activeChildId: child.id,
    themeOptions: [
      { id: 'princess', label: 'Princess', image: 'princess.svg' },
    ],
    carouselItems: [{ id: 'princess', label: 'Princess', icon: 'Princess' }],
    nameDrafts: {},
    setNameDraft: vi.fn(),
    commitDisplayName: vi.fn(),
    updateChildField,
    changeTheme: vi.fn(),
    selectChild: vi.fn(),
  })

  render(<>{descriptor.renderItem({ ...child, ...overrides })}</>)

  return updateChildField
}

describe('child failure mode control', () => {
  it('uses segmented choices to toggle test failure mode', async () => {
    const user = userEvent.setup()
    const updateChildField = renderDescriptor()

    expect(
      screen.getByRole('radiogroup', { name: 'Test failure mode' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: 'Tests have failure mode' })
    ).toHaveAttribute('aria-checked', 'true')

    await user.click(
      screen.getByRole('radio', { name: 'Tests do not have failure mode' })
    )

    expect(updateChildField).toHaveBeenCalledWith(child.id, {
      testFailureModeEnabled: false,
    })
  })
})
