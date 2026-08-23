import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ActiveChildProvider } from './contexts/ActiveChildContext'
import { SelectedDateProvider } from './contexts/SelectedDateContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AnimatedTabLayout from './routes/AnimatedTabLayout'
import { defaultTabPath } from './lib/tabNavigation'
import AppErrorBoundary from './components/AppErrorBoundary'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TestsPage = lazy(() => import('./pages/TestsPage'))
const RewardsPage = lazy(() => import('./pages/RewardsPage'))
const TimeExplorerPage = lazy(() => import('./pages/TimeExplorerPage'))
const ManageChildrenPage = lazy(() => import('./pages/ManageChildrenPage'))

const App = () => {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <SelectedDateProvider>
            <ActiveChildProvider>
              <BrowserRouter>
                <Suspense
                  fallback={<div className="h-screen w-full bg-pink-50" />}
                >
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route
                        path="/"
                        element={<Navigate to={defaultTabPath} replace />}
                      />
                      <Route path="/tabs" element={<AnimatedTabLayout />}>
                        <Route path="chores" element={<DashboardPage />} />
                        <Route path="tests" element={<TestsPage />} />
                        <Route
                          path="dashboard"
                          element={<Navigate to="/tabs/chores" replace />}
                        />
                        <Route
                          path="time-explorer"
                          element={<TimeExplorerPage />}
                        />
                        <Route path="rewards" element={<RewardsPage />} />
                      </Route>
                      <Route
                        path="/today"
                        element={<Navigate to="/tabs/chores" replace />}
                      />
                      <Route
                        path="/settings/manage-children"
                        element={<ManageChildrenPage />}
                      />
                      <Route
                        path="/settings/manage-chores"
                        element={<Navigate to="/tabs/chores" replace />}
                      />
                      <Route
                        path="/settings/manage-tests"
                        element={<Navigate to="/tabs/tests" replace />}
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
    </AppErrorBoundary>
  )
}

export default App
