import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Users, CheckCircle, XCircle, Pencil, MessageSquare, ChevronDown, ChevronUp, Save } from 'lucide-react'

const STATUS_BADGE = {
  draft: 'badge-draft', submitted: 'badge-submitted',
  approved: 'badge-approved', rejected: 'badge-rejected',
}

function GoalRow({ goal, onAction, onCheckin }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [editData, setEditData] = useState({ target: goal.target, weightage: goal.weightage })
  const [updates, setUpdates] = useState([])
  const [checkinText, setCheckinText] = useState({})

  useEffect(() => {
    if (expanded) {
      api.get(`/updates/goal/${goal.id}`).then(r => setUpdates(r.data))
    }
  }, [expanded, goal.id])

  const handleApprove = () => onAction(goal.id, 'approve')
  const handleReject = () => {
    if (!rejectReason.trim()) return
    onAction(goal.id, 'reject', rejectReason)
    setShowReject(false)
    setRejectReason('')
  }
  const handleEdit = async () => {
    await api.put(`/goals/${goal.id}/manager-edit`, editData)
    setEditing(false)
    onAction(goal.id, 'refresh')
  }
  const handleCheckin = async (updateId) => {
    const c = checkinText[updateId]
    if (!c?.trim()) return
    await api.post(`/updates/${updateId}/checkin`, { comment: c })
    setCheckinText(prev => ({ ...prev, [updateId]: '' }))
    api.get(`/updates/goal/${goal.id}`).then(r => setUpdates(r.data))
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={STATUS_BADGE[goal.status]}>{goal.status}</span>
              <span className="text-xs text-slate-500">{goal.employee?.full_name} · {goal.employee?.department}</span>
            </div>
            <h3 className="font-semibold text-white">{goal.title}</h3>
            {goal.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{goal.description}</p>}
          </div>

          {editing ? (
            <div className="flex items-center gap-2 shrink-0">
              <input className="input w-24 text-center text-sm" placeholder="Target" value={editData.target}
                onChange={e => setEditData(d => ({...d, target: e.target.value}))} />
              <input type="number" className="input w-20 text-center text-sm" placeholder="Weight" value={editData.weightage}
                onChange={e => setEditData(d => ({...d, weightage: Number(e.target.value)}))} />
              <button onClick={handleEdit} className="btn-success text-xs py-1.5 px-3 flex items-center gap-1">
                <Save className="w-3 h-3" />Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right mr-2">
                <div className="font-bold text-xl text-ink-400 font-mono">{goal.weightage}%</div>
                <div className="text-xs text-slate-500">Target: {goal.target} {goal.uom}</div>
              </div>

              {goal.status === 'submitted' && (
                <>
                  <button onClick={handleApprove} title="Approve" className="btn-success flex items-center gap-1 text-xs py-1.5 px-3">
                    <CheckCircle className="w-3.5 h-3.5" />Approve
                  </button>
                  <button onClick={() => setShowReject(!showReject)} title="Reject" className="btn-danger flex items-center gap-1 text-xs py-1.5 px-3">
                    <XCircle className="w-3.5 h-3.5" />Reject
                  </button>
                  <button onClick={() => setEditing(true)} title="Edit" className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                    <Pencil className="w-3.5 h-3.5" />Edit
                  </button>
                </>
              )}
              {goal.status === 'approved' && (
                <button onClick={() => setEditing(true)} className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                  <Pencil className="w-3.5 h-3.5" />Edit Target
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className="btn-ghost text-xs py-1.5 px-2">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {showReject && (
          <div className="mt-3 flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Reason for rejection…"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReject()} />
            <button onClick={handleReject} className="btn-danger text-xs py-1.5 px-4">Send</button>
          </div>
        )}
      </div>

      {/* Quarterly Updates */}
      {expanded && (
        <div className="border-t border-slate-800/60 p-5 bg-slate-900/40">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />Quarterly Updates & Check-ins
          </h4>
          {updates.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No quarterly updates submitted yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {updates.map(u => (
                <div key={u.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-300 font-mono">{u.quarter}</span>
                    <span className="text-sm font-bold text-white">{u.achievement} {goal.uom}</span>
                  </div>
                  {u.notes && <p className="text-xs text-slate-400 mb-2">{u.notes}</p>}
                  {u.checkin_comment ? (
                    <div className="text-xs bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 text-violet-300">
                      ✓ {u.checkin_comment}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input className="input text-xs py-1.5 flex-1" placeholder="Add check-in comment…"
                        value={checkinText[u.id] || ''}
                        onChange={e => setCheckinText(p => ({...p, [u.id]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleCheckin(u.id)} />
                      <button onClick={() => handleCheckin(u.id)} className="btn-ghost text-xs py-1.5 px-3">Add</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ManagerDashboard() {
  const [goals, setGoals] = useState([])
  const [employees, setEmployees] = useState([])
  const [filter, setFilter] = useState('submitted')
  const [empFilter, setEmpFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/goals/all')
      setGoals(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
    api.get('/employees').then(r => setEmployees(r.data))
  }, [])

  const handleAction = async (goalId, action, reason = '') => {
    if (action === 'refresh') { fetchGoals(); return }
    try {
      if (action === 'approve') await api.post(`/goals/${goalId}/approve`)
      if (action === 'reject') await api.post(`/goals/${goalId}/reject`, { reason })
      setMsg({ type: 'success', text: `Goal ${action}d successfully` })
      fetchGoals()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Action failed' })
    }
  }

  const filtered = goals.filter(g => {
    const statusMatch = filter === 'all' || g.status === filter
    const empMatch = empFilter === 'all' || g.employee_id === parseInt(empFilter)
    return statusMatch && empMatch
  })

  const counts = {
    all: goals.length,
    submitted: goals.filter(g => g.status === 'submitted').length,
    approved: goals.filter(g => g.status === 'approved').length,
    rejected: goals.filter(g => g.status === 'rejected').length,
    draft: goals.filter(g => g.status === 'draft').length,
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Team Goals</h1>
        <p className="text-slate-400 mt-1">Review, approve and provide feedback on team goals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Goals', value: counts.all, color: 'text-slate-200' },
          { label: 'Pending Review', value: counts.submitted, color: 'text-amber-300' },
          { label: 'Approved', value: counts.approved, color: 'text-emerald-300' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-300' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-6 border ${
          msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
          {['all', 'submitted', 'approved', 'rejected', 'draft'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s ? 'bg-ink-500 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {s} {counts[s] > 0 && <span className="ml-1 opacity-60">({counts[s]})</span>}
            </button>
          ))}
        </div>

        <select className="input text-sm py-2 w-auto" value={empFilter}
          onChange={e => setEmpFilter(e.target.value)}>
          <option value="all">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No goals matching this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(g => (
            <GoalRow key={g.id} goal={g} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
