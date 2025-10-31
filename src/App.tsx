import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ManageChildrenPage from './pages/ManageChildrenPage'
import ManageRewardsPage from './pages/ManageRewardsPage'
import ManageTasksPage from './pages/ManageTasksPage'
import RewardsPage from './pages/RewardsPage'
import TasksPage from './pages/TasksPage'
import ProtectedRoute from './routes/ProtectedRoute'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route
              path="/settings/manage-children"
              element={<ManageChildrenPage />}
            />
            <Route
              path="/settings/manage-tasks"
              element={<ManageTasksPage />}
            />
            <Route
              path="/settings/manage-rewards"
              element={<ManageRewardsPage />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
