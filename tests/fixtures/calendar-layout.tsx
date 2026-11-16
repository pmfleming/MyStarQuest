import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext } from '../../src/auth/AuthContext'
import { ActiveChildContext } from '../../src/contexts/ActiveChildContext'
import { SelectedDateContext } from '../../src/contexts/SelectedDateContext'
import { themes } from '../../src/contexts/ThemeContext'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { buildDateKey, parseDateKey } from '../../src/lib/today'
import '../../src/index.css'

export default function Fixture() {
  const params = new URLSearchParams(location.search)
  const theme =
    params.get('theme') === 'princess' ? themes.princess : themes.teenie
  const initialDate = params.get('date') ?? '2026-11-16'
  const [selectedDateKey, setSelectedDateKey] = useState(initialDate)
  return (
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
          activeThemeId: theme.id,
          setActiveChild: () => {},
          clearActiveChild: () => {},
        }}
      >
        <SelectedDateContext.Provider
          value={{
            selectedDateKey,
            selectedDate: parseDateKey(selectedDateKey),
            nightlyResetKey: initialDate,
            setSelectedDateKey,
            setSelectedDate: (date) => setSelectedDateKey(buildDateKey(date)),
            resetSelectedDate: () => setSelectedDateKey(initialDate),
          }}
        >
          <main style={{ maxWidth: 560, margin: '12px auto' }}>
            <SchoolCalendar theme={theme} />
          </main>
        </SelectedDateContext.Provider>
      </ActiveChildContext.Provider>
    </AuthContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
