import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { themes } from '../../src/contexts/ThemeContext'
import { DashboardHeaderActions } from '../../src/pages/dashboardChoreUi'

const actions = (theme: (typeof themes)[keyof typeof themes]) => (
  <MemoryRouter>
    <DashboardHeaderActions
      theme={theme}
      activeChildId="child-1"
      isResettingToday={false}
      onResetToday={vi.fn()}
      onLogout={vi.fn()}
    />
  </MemoryRouter>
)

describe('DashboardHeaderActions', () => {
  it('uses themed reset artwork and contains the exit artwork', () => {
    const { rerender } = render(actions(themes.princess))

    expect(screen.getByAltText('Reset today')).toHaveAttribute(
      'src',
      expect.stringContaining('Royal%20orbit%20reset')
    )

    const exitImage = screen.getByAltText('Exit')

    expect(exitImage).toHaveAttribute(
      'src',
      expect.stringContaining('exit-princess.png')
    )

    rerender(actions(themes.space))
    expect(screen.getByAltText('Reset today')).toHaveAttribute(
      'src',
      expect.stringContaining('assets/global/reset.svg')
    )
  })
})
