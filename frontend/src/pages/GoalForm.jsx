import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

const UOM_OPTIONS = ['%', 'Number', 'Score', 'Rating (1-5)', 'Hours', 'Days', 'Sessions', 'Projects', 'Certifications', 'Bugs', '$ Revenue', 'NPS Score', 'Custom']

export default function GoalForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ title: '', description: '', target: '', uom: '%', weightage: 10 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customUom, setCustomUom] = useState(false)
  const [myGoals, setMyGoals] = useState([])

  useEffect(() => {
    api.get('/goals/my').then(r => setMyGoals(r.data))
    if (isEdit) {
      api.get('/goals/my').then(r => {
        const g = r.data.find(g => g.id === parseInt(id))
        if (g) setForm({ title: g.title, description: g.description, target: g.target, uom: g.uom, weightage: g.weightage })
      })
    }
  }, [id, isEdit])

  const totalOtherWeight = myGoals
    .filter(g => g.status === 'draft' && (!isEdit || g.id !== parseInt(id)))
    .reduce((s, g) => s + g.weightage, 0)

  const remaining = 100 - totalOtherWeight
  const currentTotal = totalOtherWeight + Number(form.weightage)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.weightage < 10) { setError('Weightage must be at least 10%'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/goals/${id}`, form)
      } else {
        await api.post('/goals', form)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">{isEdit ? 'Edit Goal' : 'New Goal'}</h1>
      <p className="text-slate-400 mb-8">Each goal needs at least 10% weightage and total must equal 100%</p>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Goal Title *</label>
            <input className="input" placeholder="e.g. Improve Customer Satisfaction Score"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-24" placeholder="Describe what success looks like for this goal…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Value *</label>
              <input className="input" placeholder="e.g. 90"
                value={form.target} onChange={e => set('target', e.target.value)} required />
            </div>
            <div>
              <label className="label">Unit of Measurement *</label>
              {!customUom ? (
                <select className="input" value={form.uom}
                  onChange={e => { if (e.target.value === 'Custom') setCustomUom(true); else set('uom', e.target.value) }}>
                  {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
                </select>
              ) : (
                <input className="input" placeholder="Enter custom UoM"
                  value={form.uom} onChange={e => set('uom', e.target.value)}
                  onBlur={() => { if (!form.uom) setCustomUom(false) }} autoFocus required />
              )}
            </div>
          </div>

          <div>
            <label className="label">Weightage (%) *</label>
            <div className="flex items-center gap-4">
              <input type="range" min={10} max={Math.max(10, remaining)} step={5}
                value={form.weightage} onChange={e => set('weightage', Number(e.target.value))}
                className="flex-1 accent-ink-500" />
              <input type="number" min={10} max={100} step={1}
                className="input w-24 text-center font-mono font-bold"
                value={form.weightage} onChange={e => set('weightage', Number(e.target.value))} />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-slate-500">Min: 10%</span>
              <span className={`font-medium ${Math.abs(currentTotal - 100) < 0.01 ? 'text-emerald-400' : currentTotal > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                Running total: {currentTotal.toFixed(0)}% / 100%
              </span>
              <span className="text-slate-500">Remaining budget: {remaining.toFixed(0)}%</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${Math.abs(currentTotal - 100) < 0.01 ? 'bg-emerald-500' : currentTotal > 100 ? 'bg-red-500' : 'bg-ink-500'}`}
                style={{ width: `${Math.min(currentTotal, 100)}%` }} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              <Save className="w-4 h-4" />{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Goal'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
