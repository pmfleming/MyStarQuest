import { Suspense, lazy } from 'react'
import SchoolCalendarSync from './components/SchoolCalendarSync'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './contexts/ThemeProvider'
import { ActiveChildProvider } from './contexts/ActiveChildProvider'
import { SelectedDateProvider } from './contexts/SelectedDateProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import AnimatedTabLayout from './routes/AnimatedTabLayout'
import { defaultTabPath } from './lib/tabNavigation'
import AppErrorBoundary from './components/AppErrorBoundary'
import LoginPage from './pages/LoginPage'
import { routeModules } from './routes/routeModules'
import RoutePreloader from './routes/RoutePreloader'

const DashboardPage = lazy(routeModules.chores)
const TestsPage = lazy(routeModules.tests)
const RewardsPage = lazy(routeModules.rewards)
const TimeExplorerPage = lazy(routeModules.timeExplorer)
const ManageChildrenPage = lazy(routeModules.manageChildren)
const ProtectedDataRoute = lazy(routeModules.protectedData)

const App = () => {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <SchoolCalendarSync />
        <ThemeProvider>
          <SelectedDateProvider>
            <ActiveChildProvider>
              <BrowserRouter>
                <RoutePreloader />
                <Suspense
                  fallback={
                    <div
                      role="status"
                      className="flex h-screen w-full items-center justify-center bg-pink-50 text-purple-950"
                    >
                      Opening MyStarQuest…
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route element={<ProtectedDataRoute />}>
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
