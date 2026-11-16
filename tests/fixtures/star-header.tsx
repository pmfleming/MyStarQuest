import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../../src/auth/AuthContext'
import { ActiveChildContext } from '../../src/contexts/ActiveChildContext'
import { themes } from '../../src/contexts/ThemeContext'
import ChildStarHeader, {
  CHILD_STAR_HEADER_HEIGHT,
} from '../../src/components/ChildStarHeader'
import TabContent from '../../src/components/TabContent'
import '../../src/index.css'

export default function Fixture() {
  const params = new URLSearchParams(location.search)
  const theme =
    params.get('theme') === 'princess' ? themes.princess : themes.teenie
  const [resets, setResets] = useState(0)
  const child = {
    id: 'odette',
    displayName: params.get('name') ?? 'Odette',
    totalStars: 103,
    avatarToken: 'angel-odette-ping',
    themeId: theme.id,
    testFailureModeEnabled: true,
  }
  return (
    <AuthContext
      value={{
        user: null,
        loading: false,
        loginWithGoogle: async () => {},
        logout: async () => {},
      }}
    >
      <ActiveChildContext
        value={{
          activeChildId: child.id,
          activeThemeId: theme.id,
          setActiveChild: () => {},
          clearActiveChild: () => {},
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <div
                  style={{
                    height: '100dvh',
                    maxWidth: 560,
                    margin: 'auto',
                    background: theme.colors.bg,
                    color: theme.colors.text,
                  }}
                >
                  <TabContent
                    theme={theme}
                    headerHeight={CHILD_STAR_HEADER_HEIGHT}
                    header={
                      <ChildStarHeader
                        child={child}
                        theme={theme}
                        onResetToday={async () => {
                          setResets((n) => n + 1)
                        }}
                      />
                    }
                  >
                    <div
                      style={{ width: '90%', maxWidth: 380, margin: 'auto' }}
                    >
                      <output aria-label="Resets">{resets}</output>
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 32,
                            margin: '16px 0',
                            borderRadius: 24,
                            background: theme.colors.surface,
                          }}
                        >
                          Chore {i + 1}
                        </div>
                      ))}
                    </div>
                  </TabContent>
                </div>
              }
            />
            <Route
              path="/settings/manage-children"
              element={<h1>Children settings</h1>}
            />
          </Routes>
        </MemoryRouter>
      </ActiveChildContext>
    </AuthContext>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
