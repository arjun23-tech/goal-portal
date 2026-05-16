import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoalCard from '../components/GoalCard'
import api from '../utils/api'
import { Plus, Send, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const fetchGoals = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/my')
      setGoals(data)
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to load goals' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const draftGoals = goals.filter(g => g.status === 'draft')
  const submittedGoals = goals.filter(g => g.status === 'submitted')
  const approvedGoals = goals.filter(g => g.status === 'approved')
  const rejectedGoals = goals.filter(g => g.status === 'rejected')

  const totalWeight = draftGoals.reduce((s, g) => s + g.weightage, 0)
  const weightOk = Math.abs(totalWeight - 100) < 0.01
  const canAdd = goals.filter(g => g.status !== 'deleted').length < 8
  const canSubmit = draftGoals.length > 0 && weightOk

  const handleDelete = async (goal) => {
    if (!confirm(`Delete "${goal.title}"?`)) return
    try {
      await api.delete(`/goals/${goal.id}`)
      fetchGoals()
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Delete failed' })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data } = await api.post('/goals/submit')
      setMsg({ type: 'success', text: data.detail })
      fetchGoals()
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Submit failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const weightData = [{ value: totalWeight }, { value: 100 - totalWeight }]

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Goals</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.full_name}</p>
        </div>
        {canAdd && (
          <button onClick={() => navigate('/goals/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />New Goal
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Goals', value: goals.length, color: 'text-slate-200', max: '/8' },
          { label: 'Draft', value: draftGoals.length, color: 'text-slate-300' },
          { label: 'Submitted', value: submittedGoals.length, color: 'text-amber-300' },
          { label: 'Approved', value: approvedGoals.length, color: 'text-emerald-300' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}<span className="text-sm text-slate-500">{s.max}</span></div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-6 border ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto text-slate-500 hover:text-slate-300">✕</button>
        </div>
      )}

      {/* Draft Goals Section */}
      {draftGoals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />Draft Goals
            </h2>
            {/* Weightage bar */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-sm font-bold font-mono ${weightOk ? 'text-emerald-400' : totalWeight > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                  {totalWeight.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500">of 100%</div>
              </div>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${weightOk ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(totalWeight, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            {draftGoals.map(g => (
              <GoalCard key={g.id} goal={g}
                onEdit={g => navigate(`/goals/${g.id}/edit`)}
                onDelete={handleDelete} />
            ))}
          </div>

          {!weightOk && draftGoals.length > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Total weightage is {totalWeight.toFixed(1)}%. It must equal exactly 100% to submit.
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" />{submitting ? 'Submitting…' : 'Submit Goals for Review'}
          </button>
        </div>
      )}

      {/* Submitted */}
      {submittedGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />Pending Review
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {submittedGoals.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </div>
      )}

      {/* Approved */}
      {approvedGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />Approved Goals
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {approvedGoals.map(g => (
              <GoalCard key={g.id} goal={g}
                onUpdate={g => navigate(`/goals/${g.id}/update`)} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejectedGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-red-400 rounded-full" />Rejected
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rejectedGoals.map(g => <GoalCard key={g.id} goal={g} onEdit={g => navigate(`/goals/${g.id}/edit`)} />)}
          </div>
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="card p-16 text-center">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No goals yet</h3>
          <p className="text-slate-400 mb-6">Create your first goal to get started</p>
          <button onClick={() => navigate('/goals/new')} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />Create First Goal
          </button>
        </div>
      )}
    </div>
  )
}
