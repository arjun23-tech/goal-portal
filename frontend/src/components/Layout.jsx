import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Target, LayoutDashboard, Users, Settings, LogOut, ChevronRight, Zap } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = {
    employee: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'My Goals' },
    ],
    manager: [
      { to: '/manager', icon: Users, label: 'Team Goals' },
    ],
    admin: [
      { to: '/admin', icon: Settings, label: 'Admin Panel' },
      { to: '/manager', icon: Users, label: 'Goals Review' },
    ],
  }

  const items = navItems[user?.role] || []

  const roleColors = { employee: 'text-sky-400', manager: 'text-violet-400', admin: 'text-amber-400' }
  const roleBg = { employee: 'bg-sky-500/10 border-sky-500/20', manager: 'bg-violet-500/10 border-violet-500/20', admin: 'bg-amber-500/10 border-amber-500/20' }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col bg-slate-900/60 border-r border-slate-800/60 backdrop-blur-md">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-500 flex items-center justify-center shadow-lg shadow-ink-500/30">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight">GoalFlow</div>
              <div className="text-xs text-slate-500">Performance Portal</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-800/40">
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${roleBg[user?.role]}`}>
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">{user?.full_name}</div>
              <div className={`text-xs font-medium capitalize ${roleColors[user?.role]}`}>{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-ink-500/20 text-ink-300 border border-ink-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800/60">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
