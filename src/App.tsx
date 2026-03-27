import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ActiveChildProvider } from './contexts/ActiveChildContext'
import { SelectedDateProvider } from './contexts/SelectedDateContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AnimatedTabLayout from './routes/AnimatedTabLayout'
import { defaultTabPath } from './lib/tabNavigation'

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ChoresPage = lazy(() => import('./pages/ChoresPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ManageChildrenPage = lazy(() => import('./pages/ManageChildrenPage'))
const RewardsPage = lazy(() => import('./pages/RewardsPage'))
const TimeExplorerPage = lazy(() => import('./pages/TimeExplorerPage'))

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SelectedDateProvider>
          <ActiveChildProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="h-screen w-full bg-black" />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/"
                      element={<Navigate to={defaultTabPath} replace />}
                    />
                    <Route path="/tabs" element={<AnimatedTabLayout />}>
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route
                        path="time-explorer"
                        element={<TimeExplorerPage />}
                      />
                      <Route path="rewards" element={<RewardsPage />} />
                    </Route>
                    <Route
                      path="/today"
                      element={<Navigate to="/tabs/dashboard" replace />}
                    />
                    <Route
                      path="/settings/manage-children"
                      element={<ManageChildrenPage />}
                    />
                    <Route
                      path="/settings/manage-tasks"
                      element={<ChoresPage />}
                    />
                    <Route
                      path="/settings/manage-rewards"
                      element={<Navigate to="/tabs/rewards" replace />}
                    />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ActiveChildProvider>
        </SelectedDateProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
