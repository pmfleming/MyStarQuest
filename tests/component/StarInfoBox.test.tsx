import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'

afterEach(cleanup)

it.each([' ', '{Enter}'])(
  'replays through the native button with %s',
  async (key) => {
    const user = userEvent.setup()
    render(<StarInfoBox theme={themes.princess} totalStars={0} />)
    await screen.findByText('0')
    const button = screen.getByRole('button', { name: 'Replay star animation' })
    expect(button.tagName).toBe('BUTTON')
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard(key)
    expect(button).not.toHaveTextContent('0')
  }
)
