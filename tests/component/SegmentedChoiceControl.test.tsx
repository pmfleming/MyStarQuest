import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SegmentedChoiceControl from '../../src/components/ui/SegmentedChoiceControl'
import { themes } from '../../src/contexts/ThemeContext'
import { uiTokens } from '../../src/tokens'

describe('SegmentedChoiceControl', () => {
  it('renders a radiogroup and reports selected option changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SegmentedChoiceControl
        theme={themes.princess}
        value="animals"
        ariaLabel="Spelling pictures"
        onChange={onChange}
        options={[
          { value: 'animals', label: 'Animals' },
          { value: 'teenie', label: 'Teenie' },
        ]}
      />
    )

    const group = screen.getByRole('radiogroup')
    const selectedOption = screen.getByRole('radio', { name: 'Animals' })
    const inactiveOption = screen.getByRole('radio', { name: 'Teenie' })

    expect(group).toHaveAccessibleName('Spelling pictures')
    expect(group).toHaveStyle({
      height: `${uiTokens.listActionHeight}px`,
      background: themes.princess.colors.surface,
      padding: `${uiTokens.controlInset / 2}px`,
    })
    expect(group.style.minHeight).toBe(`${uiTokens.listActionHeight}px`)
    expect(group.style.maxHeight).toBe(`${uiTokens.listActionHeight}px`)
    const accentColor = document.createElement('span')
    accentColor.style.color = themes.princess.colors.accent
    expect(group.style.borderWidth).toBe('2px')
    expect(group.style.borderStyle).toBe('solid')
    expect(group.style.borderColor).toBe(accentColor.style.color)
    expect(selectedOption).toHaveStyle({
      background: themes.princess.colors.primary,
    })
    expect(selectedOption.style.borderStyle).toBe('none')
    expect(inactiveOption).toHaveStyle({ background: 'transparent' })
    expect(selectedOption).toHaveAttribute('aria-checked', 'true')
    expect(inactiveOption).toHaveAttribute('aria-checked', 'false')

    await user.click(screen.getByRole('radio', { name: 'Teenie' }))

    expect(onChange).toHaveBeenCalledWith('teenie')
  })
})
