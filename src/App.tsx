import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ActiveChildProvider } from './contexts/ActiveChildContext'
import DashboardPage from './pages/DashboardPage'
import ChoresPage from './pages/ChoresPage'
import LoginPage from './pages/LoginPage'
import ManageChildrenPage from './pages/ManageChildrenPage'
import RewardsPage from './pages/RewardsPage'
import TimeExplorerPage from './pages/TimeExplorerPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { defaultTabPath } from './lib/tabNavigation'

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ActiveChildProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/"
                  element={<Navigate to={defaultTabPath} replace />}
                />
                <Route path="/tabs/dashboard" element={<DashboardPage />} />
                <Route
                  path="/tabs/time-explorer"
                  element={<TimeExplorerPage />}
                />
                <Route path="/tabs/rewards" element={<RewardsPage />} />
                <Route
                  path="/today"
                  element={<Navigate to="/tabs/dashboard" replace />}
                />
                <Route
                  path="/settings/manage-children"
                  element={<ManageChildrenPage />}
                />
                <Route path="/settings/manage-tasks" element={<ChoresPage />} />
                <Route
                  path="/settings/manage-rewards"
                  element={<Navigate to="/tabs/rewards" replace />}
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ActiveChildProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
