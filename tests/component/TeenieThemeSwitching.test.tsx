import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext'
import {
  ActiveChildProvider,
  useActiveChild,
} from '../../src/contexts/ActiveChildContext'
import { getChoreImage } from '../../src/assets/chores/assets'
import { getTabIcon } from '../../src/lib/tabNavigation'
import ChoreCreationFlow from '../../src/pages/ChoreCreationFlow'

vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'theme-test' } }),
}))

function ChildSwitch() {
  const { theme } = useTheme()
  const { setActiveChild } = useActiveChild()
  return (
    <>
      <button
        onClick={() =>
          setActiveChild({ id: 'teenie-child', themeId: 'teenie' })
        }
      >
        Teenie child
      </button>
      <button
        onClick={() =>
          setActiveChild({ id: 'princess-child', themeId: 'princess' })
        }
      >
        Princess child
      </button>
      <output>{theme.name}</output>
      <img
        alt="Saved brave chore"
        src={getChoreImage('bravePrincess', theme.id)}
      />
      <img alt="Chores tab" src={getTabIcon('chores', theme.id)} />
      <ChoreCreationFlow
        theme={theme}
        isSaving={false}
        onSave={() => {}}
        onCancel={() => {}}
      />
    </>
  )
}
function mount() {
  return render(
    <ThemeProvider>
      <ActiveChildProvider>
        <ChildSwitch />
      </ActiveChildProvider>
    </ThemeProvider>
  )
}
beforeEach(() => localStorage.clear())
afterEach(cleanup)

it('keeps the current theme when an unknown identifier is requested', () => {
  const unknownTheme = 'unknown-theme'
  function SavedThemeSwitch() {
    const { theme, setTheme } = useTheme()
    return (
      <>
        <output>{theme.id}</output>
        <button onClick={() => setTheme('teenie')}>Teenie</button>
        <button onClick={() => setTheme(unknownTheme)}>Saved theme</button>
      </>
    )
  }
  render(
    <ThemeProvider>
      <SavedThemeSwitch />
    </ThemeProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Teenie' }))
  expect(screen.getByText('teenie')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Saved theme' }))
  expect(screen.getByText('teenie')).toBeInTheDocument()
})

it('switches child artwork immediately and restores Teenie selection after remount', async () => {
  const view = mount()
  fireEvent.click(screen.getByRole('button', { name: 'Teenie child' }))
  await screen.findByText('Teenie Friends')
  expect(
    screen.getByAltText('Saved brave chore').getAttribute('src')
  ).toContain('/teenie/brave.webp')
  expect(screen.getByAltText('Chores tab').getAttribute('src')).toContain(
    '/teenie/tidying-up.webp'
  )
  const dinnerChoice = screen.getByRole('button', { name: 'Dinner' })
  expect(dinnerChoice.querySelector('img')?.getAttribute('src')).toContain(
    '/teenie/'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Princess child' }))
  await screen.findByText('Royal Kingdom')
  expect(
    screen.getByAltText('Saved brave chore').getAttribute('src')
  ).toContain('/princess/')
  fireEvent.click(screen.getByRole('button', { name: 'Teenie child' }))
  view.unmount()
  mount()
  await screen.findByText('Teenie Friends')
  expect(
    screen.getByAltText('Saved brave chore').getAttribute('src')
  ).toContain('/teenie/')
})
