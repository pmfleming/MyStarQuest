import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { themes } from '../../src/contexts/ThemeContext'
import { DashboardHeaderActions } from '../../src/pages/dashboardChoreUi'

describe('DashboardHeaderActions', () => {
  it.each([
    ['princess', themes.princess, 'Royal%20orbit%20reset'],
    ['generic', themes.space, 'assets/global/reset.svg'],
  ])('uses the %s reset artwork for the active theme', (_, theme, marker) => {
    render(
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

    expect(screen.getByAltText('Reset today')).toHaveAttribute(
      'src',
      expect.stringContaining(marker)
    )
  })

  it('contains the princess exit artwork inside the header button', () => {
    render(
      <MemoryRouter>
        <DashboardHeaderActions
          theme={themes.princess}
          activeChildId="child-1"
          isResettingToday={false}
          onResetToday={vi.fn()}
          onLogout={vi.fn()}
        />
      </MemoryRouter>
    )

    const exitImage = screen.getByAltText('Exit')

    expect(exitImage).toHaveAttribute(
      'src',
      expect.stringContaining('exit-princess.png')
    )
    expect(exitImage).toHaveStyle({
      width: '30px',
      height: '30px',
      objectFit: 'contain',
    })
  })
})
