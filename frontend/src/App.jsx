import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import GoalForm from './pages/GoalForm'
import ManagerDashboard from './pages/ManagerDashboard'
import QuarterlyUpdate from './pages/QuarterlyUpdate'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — Option A: Selective Modernist Borrow
   ─────────────────────────────────────────────────────────────────────────
   Cobalt accent    #1351AA   primary interactive / highlights
   Cobalt hover     #1a63cc   button / link hover
   Cobalt tint      rgba(19,81,170,0.10)  tinted surfaces

   Page bg          #0c0e12   near-black base
   Surface          #111318   card / panel
   Surface-raised   #16191f   hover state
   Border           #1e2128   default 1px border
   Border-strong    #252830   emphasis border

   Text-primary     #f0f1f3   headings
   Text-secondary   #8b8f9a   body / descriptions
   Text-muted       #4a4d58   labels, metadata

   Typography rules (borrowed from Poster Modernist):
   • Headlines  → font-black  tracking-tight  leading-none
   • UI labels  → text-[10px] uppercase  tracking-[0.18em]  font-bold  text-muted
   • Numbers    → font-mono   tabular-nums
   • Transitions→ 0.15s linear (no bounce)
   ───────────────────────────────────────────────────────────────────────── */

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: '#0c0e12' }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{ background: '#1351AA' }}
        >
          <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
            <path
              d="M7 1L11.5 3.75V9.25L7 13L2.5 9.25V3.75L7 1Z"
              stroke="white" strokeWidth="1.4" strokeLinejoin="round"
            />
            <circle cx="7" cy="7" r="1.75" fill="white" />
          </svg>
        </div>
        <span
          className="font-black uppercase text-sm"
          style={{ color: '#f0f1f3', letterSpacing: '-0.01em' }}
        >
          GoalFlow
        </span>
      </div>

      {/* Linear progress track — no bounce, pure linear */}
      <div
        className="w-36 h-px relative overflow-hidden"
        style={{ background: '#1e2128' }}
      >
        <div
          className="absolute inset-y-0 w-16"
          style={{
            background: '#1351AA',
            animation: 'gfSlide 1.3s linear infinite',
          }}
        />
      </div>

      <p
        className="font-bold uppercase"
        style={{
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: '#4a4d58',
        }}
      >
        Loading workspace
      </p>

      <style>{`
        @keyframes gfSlide {
          0%   { transform: translateX(-64px); }
          100% { transform: translateX(144px); }
        }
      `}</style>
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
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
            <Route
              path="/dashboard"
              element={<ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>}
            />
            <Route
              path="/goals/new"
              element={<ProtectedRoute roles={['employee']}><GoalForm /></ProtectedRoute>}
            />
            <Route
              path="/goals/:id/edit"
              element={<ProtectedRoute roles={['employee']}><GoalForm /></ProtectedRoute>}
            />
            <Route
              path="/goals/:id/update"
              element={<ProtectedRoute roles={['employee']}><QuarterlyUpdate /></ProtectedRoute>}
            />
            <Route
              path="/manager"
              element={<ProtectedRoute roles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
