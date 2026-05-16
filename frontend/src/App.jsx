import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import GoalForm from './pages/GoalForm'
import ManagerDashboard from './pages/ManagerDashboard'
import QuarterlyUpdate from './pages/QuarterlyUpdate'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink-500 border-t-transparent rounded-full animate-spin"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }/>
            <Route path="/goals/new" element={
              <ProtectedRoute roles={['employee']}>
                <GoalForm />
              </ProtectedRoute>
            }/>
            <Route path="/goals/:id/edit" element={
              <ProtectedRoute roles={['employee']}>
                <GoalForm />
              </ProtectedRoute>
            }/>
            <Route path="/goals/:id/update" element={
              <ProtectedRoute roles={['employee']}>
                <QuarterlyUpdate />
              </ProtectedRoute>
            }/>
            <Route path="/manager" element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }/>
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
