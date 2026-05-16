import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Save, MessageSquare, Calendar } from 'lucide-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export default function QuarterlyUpdate() {
  const navigate = useNavigate()
  const { id: goalId } = useParams()
  const [goal, setGoal] = useState(null)
  const [updates, setUpdates] = useState([])
  const [activeQ, setActiveQ] = useState('Q1')
  const [form, setForm] = useState({ achievement: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/goals/my').then(r => {
      const g = r.data.find(g => g.id === parseInt(goalId))
      setGoal(g)
    })
    fetchUpdates()
  }, [goalId])

  const fetchUpdates = async () => {
    const { data } = await api.get(`/updates/goal/${goalId}`)
    setUpdates(data)
  }

  const getUpdate = (q) => updates.find(u => u.quarter === q)

  const selectQuarter = (q) => {
    setActiveQ(q)
    const existing = getUpdate(q)
    setForm({ achievement: existing?.achievement || '', notes: existing?.notes || '' })
    setMsg(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/updates', { goal_id: parseInt(goalId), quarter: activeQ, ...form })
      setMsg({ type: 'success', text: `${activeQ} update saved!` })
      fetchUpdates()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  if (!goal) return <div className="p-8 text-slate-400">Loading…</div>

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Quarterly Update</h1>
        <p className="text-ink-300 font-medium">{goal.title}</p>
        <div className="flex gap-4 mt-2 text-sm text-slate-400">
          <span>Target: <strong className="text-white">{goal.target} {goal.uom}</strong></span>
          <span>Weight: <strong className="text-white">{goal.weightage}%</strong></span>
        </div>
      </div>

      {/* Quarter tabs */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => {
          const u = getUpdate(q)
          return (
            <button key={q} onClick={() => selectQuarter(q)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeQ === q
                  ? 'bg-ink-500 text-white shadow-lg shadow-ink-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40'
              }`}>
              <Calendar className="w-3.5 h-3.5" />{q}
              {u && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">{activeQ} Achievement</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Achievement Value *</label>
              <div className="flex items-center gap-2">
                <input className="input flex-1" placeholder={`e.g. 85`}
                  value={form.achievement} onChange={e => setForm(f => ({ ...f, achievement: e.target.value }))} required />
                <span className="text-slate-400 text-sm shrink-0">{goal.uom}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Target: {goal.target} {goal.uom}</div>
            </div>
            <div>
              <label className="label">Notes / Comments</label>
              <textarea className="input resize-none h-28" placeholder="What did you achieve? Any blockers or insights?"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {msg && (
              <div className={`text-sm rounded-xl px-3 py-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-400'}`}>
                {msg.text}
              </div>
            )}

            <button type="submit" className="btn-primary flex items-center gap-2 w-full justify-center" disabled={saving}>
              <Save className="w-4 h-4" />{saving ? 'Saving…' : `Save ${activeQ} Update`}
            </button>
          </form>
        </div>

        {/* All quarters summary */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Progress Summary</h2>
          <div className="space-y-3">
            {QUARTERS.map(q => {
              const u = getUpdate(q)
              return (
                <div key={q} className={`p-4 rounded-xl border ${u ? 'bg-slate-800/40 border-slate-700/40' : 'border-slate-800/40 border-dashed opacity-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-300">{q}</span>
                    {u ? (
                      <span className="text-sm font-bold text-ink-300 font-mono">{u.achievement} {goal.uom}</span>
                    ) : (
                      <span className="text-xs text-slate-500">Not submitted</span>
                    )}
                  </div>
                  {u?.notes && <p className="text-xs text-slate-400 mt-1">{u.notes}</p>}
                  {u?.checkin_comment && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40">
                      <div className="flex items-center gap-1.5 text-xs text-violet-400 mb-1">
                        <MessageSquare className="w-3 h-3" />Manager Check-in
                      </div>
                      <p className="text-xs text-slate-300">{u.checkin_comment}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
