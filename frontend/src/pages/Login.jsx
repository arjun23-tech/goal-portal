import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import api from '../utils/api'

const DEMO_USERS = [
  { label: 'Admin', user: 'admin', pass: 'admin123', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' },
  { label: 'Manager', user: 'manager1', pass: 'manager123', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40' },
  { label: 'Employee (Approved)', user: 'john', pass: 'emp123', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40' },
  { label: 'Employee (Pending)', user: 'jane', pass: 'emp123', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40' },
  { label: 'Employee (Draft)', user: 'mike', pass: 'emp123', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40' },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'manager') navigate('/manager')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u, p) => { setUsername(u); setPassword(p) }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await api.post('/seed')
      setError('')
      alert('✅ Demo data seeded! You can now log in with the demo accounts.')
    } catch {
      setError('Seeding failed')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ink-500 shadow-2xl shadow-ink-500/40 mb-4">
            <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GoalFlow</h1>
          <p className="text-slate-400 mt-1">Company Performance Portal</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="Enter username" value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPass ? 'text' : 'password'}
                  placeholder="Enter password" value={password}
                  onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/60">
            <p className="text-xs text-slate-500 text-center mb-3 font-medium uppercase tracking-wider">Quick Demo Login</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map(d => (
                <button key={d.user} onClick={() => quickLogin(d.user, d.pass)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${d.bg}`}>
                  <span className={d.color}>{d.label}</span>
                  <span className="text-slate-500 font-mono">{d.user} / {d.pass}</span>
                </button>
              ))}
            </div>

            <button onClick={handleSeed} disabled={seeding}
              className="mt-4 w-full btn-ghost text-xs py-2">
              {seeding ? 'Seeding…' : '🌱 Seed Demo Data (first time setup)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
