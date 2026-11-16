import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AnimatedTabLayout from '../../src/routes/AnimatedTabLayout'
import TestCategoryPicker from '../../src/components/TestCategoryPicker'
import TestCategoryPanels from '../../src/components/TestCategoryPanels'
import {
  categoryLabels,
  type TestCategory,
} from '../../src/data/testCategories'
import { AuthContext } from '../../src/auth/AuthContext'
import { ActiveChildContext } from '../../src/contexts/ActiveChildContext'
import { SelectedDateProvider } from '../../src/contexts/SelectedDateProvider'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import TimeExplorerPage from '../../src/pages/TimeExplorerPage'
import '../../src/index.css'

export function Categories() {
  const [selected, setSelected] = useState<TestCategory>('numbers')
  return (
    <div>
      <TestCategoryPicker
        theme={themes.teenie}
        selected={selected}
        onSelect={setSelected}
      />
      <div style={{ paddingTop: 120 }}>
        <TestCategoryPanels selected={selected}>
          {(category) => (
            <div style={{ height: 300 }}>
              <input aria-label={`${categoryLabels[category]} answer`} />
            </div>
          )}
        </TestCategoryPanels>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <AuthContext.Provider
    value={{
      user: null,
      loading: false,
      loginWithGoogle: async () => {},
      logout: async () => {},
    }}
  >
    <ActiveChildContext.Provider
      value={{
        activeChildId: null,
        activeThemeId: 'teenie',
        setActiveChild: () => {},
        clearActiveChild: () => {},
      }}
    >
      <ThemeContext.Provider
        value={{
          theme: themes.teenie,
          currentTheme: 'teenie',
          setTheme: () => {},
        }}
      >
        <SelectedDateProvider>
          <main style={{ height: '100dvh', maxWidth: 560, margin: 'auto' }}>
            {new URLSearchParams(location.search).has('tabs') ? (
              <MemoryRouter initialEntries={['/tabs/time-explorer']}>
                <Routes>
                  <Route path="/tabs" element={<AnimatedTabLayout />}>
                    <Route
                      path="time-explorer"
                      element={<TimeExplorerPage />}
                    />
                    <Route path="tests" element={<Categories />} />
                    <Route path="rewards" element={<h1>Rewards page</h1>} />
                    <Route path="chores" element={<h1>Chores page</h1>} />
                  </Route>
                </Routes>
              </MemoryRouter>
            ) : (
              <TimeExplorerPage />
            )}
          </main>
        </SelectedDateProvider>
      </ThemeContext.Provider>
    </ActiveChildContext.Provider>
  </AuthContext.Provider>
)
