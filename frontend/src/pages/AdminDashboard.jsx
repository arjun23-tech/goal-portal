import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Download, Unlock, RefreshCw, Shield, TrendingUp, Users, Target, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_BADGE = {
  draft: 'badge-draft', submitted: 'badge-submitted',
  approved: 'badge-approved', rejected: 'badge-rejected',
}
const STATUS_COLOR = { draft: '#64748b', submitted: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }

export default function AdminDashboard() {
  const [goals, setGoals] = useState([])
  const [stats, setStats] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filter, setFilter] = useState('all')
  const [empFilter, setEmpFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      const [goalsRes, statsRes, empsRes] = await Promise.all([
        api.get('/goals/all'),
        api.get('/stats/overview'),
        api.get('/employees'),
      ])
      setGoals(goalsRes.data)
      setStats(statsRes.data)
      setEmployees(empsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUnlock = async (goalId, title) => {
    if (!confirm(`Unlock "${title}" back to draft?`)) return
    try {
      await api.post(`/goals/${goalId}/unlock`)
      setMsg({ type: 'success', text: 'Goal unlocked to draft' })
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Unlock failed' })
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'goals_report.csv'
      a.click()
      URL.revokeObjectURL(url)
      setMsg({ type: 'success', text: 'CSV exported!' })
    } catch {
      setMsg({ type: 'error', text: 'Export failed' })
    }
  }

  const filtered = goals.filter(g => {
    const statusMatch = filter === 'all' || g.status === filter
    const empMatch = empFilter === 'all' || g.employee_id === parseInt(empFilter)
    const searchMatch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.employee?.full_name?.toLowerCase().includes(search.toLowerCase())
    return statusMatch && empMatch && searchMatch
  })

  const chartData = stats ? [
    { name: 'Draft', value: stats.draft, color: STATUS_COLOR.draft },
    { name: 'Submitted', value: stats.submitted, color: STATUS_COLOR.submitted },
    { name: 'Approved', value: stats.approved, color: STATUS_COLOR.approved },
    { name: 'Rejected', value: stats.rejected, color: STATUS_COLOR.rejected },
  ] : []

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">System overview and management</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Employees', value: stats.total_employees, color: 'text-sky-300', iconColor: 'text-sky-400' },
            { icon: Target, label: 'Total Goals', value: stats.total_goals, color: 'text-slate-200', iconColor: 'text-slate-400' },
            { icon: CheckCircle, label: 'Approved', value: stats.approved, color: 'text-emerald-300', iconColor: 'text-emerald-400' },
            { icon: TrendingUp, label: 'Q Updates', value: stats.total_updates, color: 'text-ink-300', iconColor: 'text-ink-400' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <s.icon className={`w-5 h-5 ${s.iconColor} mb-1`} />
              <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Goal Status Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={48}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee list */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Employees ({employees.length})</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {employees.map(e => {
              const empGoals = goals.filter(g => g.employee_id === e.id)
              const approved = empGoals.filter(g => g.status === 'approved').length
              return (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {e.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{e.full_name}</div>
                    <div className="text-xs text-slate-500">{e.department}</div>
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">{approved}/{empGoals.length}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-6 border ${
          msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* All Goals Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-800/60 flex flex-wrap gap-3 items-center">
          <h2 className="text-lg font-semibold text-white flex-1">All Goals</h2>
          <input className="input text-sm py-2 w-56" placeholder="Search goals or employees…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input text-sm py-2 w-auto" value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
            {['all', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-ink-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Employee</th>
                <th className="text-left px-5 py-3">Goal</th>
                <th className="text-left px-5 py-3">Target</th>
                <th className="text-left px-5 py-3">UoM</th>
                <th className="text-left px-5 py-3">Weight</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-200">{g.employee?.full_name}</div>
                    <div className="text-xs text-slate-500">{g.employee?.department}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-white max-w-xs truncate">{g.title}</div>
                    {g.rejection_reason && <div className="text-xs text-red-400 truncate max-w-xs">↳ {g.rejection_reason}</div>}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300">{g.target}</td>
                  <td className="px-5 py-3 text-slate-400">{g.uom}</td>
                  <td className="px-5 py-3 font-mono font-bold text-ink-300">{g.weightage}%</td>
                  <td className="px-5 py-3"><span className={STATUS_BADGE[g.status]}>{g.status}</span></td>
                  <td className="px-5 py-3">
                    {(g.status === 'approved' || g.status === 'submitted') && (
                      <button onClick={() => handleUnlock(g.id, g.title)}
                        className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all">
                        <Unlock className="w-3 h-3" />Unlock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">No goals found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
