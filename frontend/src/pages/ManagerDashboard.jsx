import { useState, useEffect, useContext } from 'react'
import api from '../utils/api'
import { SearchContext } from '../components/Layout'
import {
  Users, CheckCircle, XCircle, Pencil, MessageSquare,
  ChevronDown, ChevronUp, Save, X, BarChart3,
  Clock, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react'

/* ── Design tokens ────────────────────────────────────────────────────── */
const T = {
  pageBg:        '#0c0e12',
  surface:       '#111318',
  surfaceHover:  '#16191f',
  surfaceActive: '#1a1e26',
  border:        '#1e2128',
  borderStrong:  '#252830',
  cobalt:        '#1351AA',
  cobaltHover:   '#1a63cc',
  cobaltTint:    'rgba(19,81,170,0.10)',
  cobaltBorder:  'rgba(19,81,170,0.22)',
  textPrimary:   '#f0f1f3',
  textSecondary: '#8b8f9a',
  textMuted:     '#4a4d58',
  emerald:       '#34d399',
  emeraldTint:   'rgba(52,211,153,0.09)',
  emeraldBorder: 'rgba(52,211,153,0.20)',
  amber:         '#fbbf24',
  amberTint:     'rgba(251,191,36,0.09)',
  amberBorder:   'rgba(251,191,36,0.20)',
  rose:          '#f87171',
  roseTint:      'rgba(248,113,113,0.08)',
  roseBorder:    'rgba(248,113,113,0.18)',
  violet:        '#a78bfa',
  violetTint:    'rgba(167,139,250,0.09)',
  violetBorder:  'rgba(167,139,250,0.20)',
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function Label({ children, color }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.18em',
      fontWeight: 700, textTransform: 'uppercase',
      color: color ?? T.textMuted,
    }}>
      {children}
    </span>
  )
}

const STATUS_META = {
  draft:     { label: 'Draft',     color: T.textMuted,   bg: T.surfaceHover,  border: T.border },
  submitted: { label: 'Pending',   color: T.amber,       bg: T.amberTint,     border: T.amberBorder },
  approved:  { label: 'Approved',  color: T.emerald,     bg: T.emeraldTint,   border: T.emeraldBorder },
  rejected:  { label: 'Rejected',  color: T.rose,        bg: T.roseTint,      border: T.roseBorder },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.draft
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.14em', fontWeight: 700,
      textTransform: 'uppercase', padding: '2px 8px',
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
    }}>
      {m.label}
    </span>
  )
}

function IconBtn({ onClick, title, children, danger, active }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 11px',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        border: `1px solid ${
          danger ? (hov ? T.rose : T.roseBorder)
          : active ? T.cobaltBorder
          : hov ? T.borderStrong : T.border}`,
        background: danger ? (hov ? T.roseTint : 'transparent')
          : active ? T.cobaltTint
          : hov ? T.surfaceHover : 'transparent',
        color: danger ? T.rose : active ? T.cobalt : hov ? T.textPrimary : T.textSecondary,
        cursor: 'pointer', transition: 'all 0.15s linear',
      }}
    >
      {children}
    </button>
  )
}

/* ── Progress bar (for goal weight) ──────────────────────────────────── */
function WeightBar({ value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 3, background: T.border, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${Math.min(value, 100)}%`,
          background: value >= 30 ? T.cobalt : T.textMuted,
          transition: 'width 0.4s linear',
        }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: T.textSecondary, minWidth: 36 }}>
        {value}%
      </span>
    </div>
  )
}

/* ── Quarterly update card ────────────────────────────────────────────── */
function UpdateCard({ u, goal, checkinText, onCheckinChange, onCheckin }) {
  const pct = goal.target ? Math.round((u.achievement / goal.target) * 100) : 0
  const clampPct = Math.min(pct, 100)

  return (
    <div style={{
      background: T.surfaceHover,
      border: `1px solid ${T.borderStrong}`,
      padding: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <Label color={T.cobalt}>{u.quarter}</Label>
          {u.notes && (
            <p style={{ marginTop: 6, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
              {u.notes}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.textPrimary, letterSpacing: '-0.02em' }}>
            {u.achievement}
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>{goal.uom}</span>
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
            target: {goal.target} {goal.uom}
          </div>
        </div>
      </div>

      {/* Progress arc */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Label>Progress</Label>
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
            color: clampPct >= 100 ? T.emerald : clampPct >= 60 ? T.amber : T.textMuted }}>
            {clampPct}%
          </span>
        </div>
        <div style={{ height: 3, background: T.border, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${clampPct}%`,
            background: clampPct >= 100 ? T.emerald : clampPct >= 60 ? T.amber : T.cobalt,
            transition: 'width 0.4s linear',
          }} />
        </div>
      </div>

      {/* Check-in area */}
      {u.checkin_comment ? (
        <div style={{
          padding: '8px 12px',
          background: T.violetTint,
          border: `1px solid ${T.violetBorder}`,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <CheckCircle2 size={11} style={{ color: T.violet, marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.violet, lineHeight: 1.5 }}>{u.checkin_comment}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            style={{
              flex: 1, background: T.surface,
              border: `1px solid ${T.border}`, color: T.textPrimary,
              padding: '6px 10px', fontSize: 11,
              outline: 'none', transition: 'border-color 0.15s linear',
            }}
            placeholder="Add check-in comment…"
            value={checkinText[u.id] || ''}
            onChange={e => onCheckinChange(u.id, e.target.value)}
            onFocus={e => e.target.style.borderColor = T.cobaltBorder}
            onBlur={e => e.target.style.borderColor = T.border}
            onKeyDown={e => e.key === 'Enter' && onCheckin(u.id)}
          />
          <button
            onClick={() => onCheckin(u.id)}
            style={{
              padding: '6px 12px', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: T.cobalt, color: '#f0f1f3',
              border: 'none', cursor: 'pointer', transition: 'background 0.15s linear',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.cobaltHover}
            onMouseLeave={e => e.currentTarget.style.background = T.cobalt}
          >
            Post
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Goal row ─────────────────────────────────────────────────────────── */
function GoalRow({ goal, onAction }) {
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [editData, setEditData]     = useState({ target: goal.target, weightage: goal.weightage })
  const [updates, setUpdates]       = useState([])
  const [checkinText, setCheckinText] = useState({})
  const [rejFocus, setRejFocus]     = useState(false)

  useEffect(() => {
    if (expanded) {
      api.get(`/updates/goal/${goal.id}`).then(r => setUpdates(r.data))
    }
  }, [expanded, goal.id])

  const handleApprove = () => onAction(goal.id, 'approve')
  const handleReject  = () => {
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
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

      {/* ── Main row ── */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

          {/* Left: meta + title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <StatusBadge status={goal.status} />
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
                {goal.employee?.full_name}
              </span>
              {goal.employee?.department && (
                <>
                  <span style={{ color: T.border, fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{goal.employee.department}</span>
                </>
              )}
            </div>

            <h3 style={{
              fontSize: 14, fontWeight: 700, color: T.textPrimary,
              letterSpacing: '-0.01em', marginBottom: 4,
            }}>
              {goal.title}
            </h3>

            {goal.description && (
              <p style={{
                fontSize: 12, color: T.textSecondary, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {goal.description}
              </p>
            )}

            {/* Weight bar */}
            <div style={{ marginTop: 10, maxWidth: 200 }}>
              <WeightBar value={goal.weightage} />
            </div>
          </div>

          {/* Right: actions */}
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <input
                placeholder="Target"
                value={editData.target}
                onChange={e => setEditData(d => ({ ...d, target: e.target.value }))}
                style={{
                  width: 90, padding: '6px 10px', fontSize: 12,
                  background: T.surfaceHover, border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary, outline: 'none', textAlign: 'center',
                }}
              />
              <input
                type="number"
                placeholder="Weight"
                value={editData.weightage}
                onChange={e => setEditData(d => ({ ...d, weightage: Number(e.target.value) }))}
                style={{
                  width: 72, padding: '6px 10px', fontSize: 12,
                  background: T.surfaceHover, border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary, outline: 'none', textAlign: 'center',
                }}
              />
              <IconBtn onClick={handleEdit} active title="Save">
                <Save size={11} /> Save
              </IconBtn>
              <IconBtn onClick={() => setEditing(false)} title="Cancel">
                <X size={11} /> Cancel
              </IconBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Weight label */}
              <div style={{ textAlign: 'right', paddingRight: 12,
                borderRight: `1px solid ${T.border}`, marginRight: 4 }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: 20, fontWeight: 800,
                  color: T.cobalt, letterSpacing: '-0.03em',
                }}>
                  {goal.weightage}%
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>
                  {goal.target} {goal.uom}
                </div>
              </div>

              {goal.status === 'submitted' && (
                <>
                  <IconBtn onClick={handleApprove} title="Approve">
                    <CheckCircle size={11} style={{ color: T.emerald }} /> Approve
                  </IconBtn>
                  <IconBtn onClick={() => setShowReject(!showReject)} title="Reject" danger>
                    <XCircle size={11} /> Reject
                  </IconBtn>
                  <IconBtn onClick={() => setEditing(true)} title="Edit">
                    <Pencil size={11} /> Edit
                  </IconBtn>
                </>
              )}
              {goal.status === 'approved' && (
                <IconBtn onClick={() => setEditing(true)} title="Edit Target">
                  <Pencil size={11} /> Edit
                </IconBtn>
              )}

              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  padding: '6px 8px', background: 'transparent',
                  border: `1px solid ${T.border}`, color: T.textMuted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  transition: 'all 0.15s linear',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted }}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Reject input */}
        {showReject && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              style={{
                flex: 1, padding: '8px 12px', fontSize: 12,
                background: T.surfaceHover,
                border: `1px solid ${rejFocus ? T.roseBorder : T.border}`,
                color: T.textPrimary, outline: 'none',
                transition: 'border-color 0.15s linear',
              }}
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              onFocus={() => setRejFocus(true)}
              onBlur={() => setRejFocus(false)}
              onKeyDown={e => e.key === 'Enter' && handleReject()}
            />
            <button
              onClick={handleReject}
              style={{
                padding: '8px 20px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: T.roseTint, border: `1px solid ${T.roseBorder}`,
                color: T.rose, cursor: 'pointer', transition: 'all 0.15s linear',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.roseTint }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded: quarterly updates ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, background: T.pageBg, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 2, height: 14, background: T.violet, flexShrink: 0 }} />
            <Label color={T.violet}>Quarterly Updates &amp; Check-ins</Label>
            {updates.length > 0 && (
              <span style={{
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                color: T.textMuted, background: T.surfaceHover,
                border: `1px solid ${T.border}`, padding: '1px 6px',
              }}>
                {updates.length}
              </span>
            )}
          </div>

          {updates.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px', border: `1px dashed ${T.borderStrong}`,
            }}>
              <MessageSquare size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
                No quarterly updates submitted yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1, background: T.border }}>
              {updates.map(u => (
                <UpdateCard
                  key={u.id}
                  u={u}
                  goal={goal}
                  checkinText={checkinText}
                  onCheckinChange={(id, val) => setCheckinText(p => ({ ...p, [id]: val }))}
                  onCheckin={handleCheckin}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accentColor, accentTint, accentBorder, onClick, active }) {
  const [hov, setHov] = useState(false)
  const isOn = active || hov
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: '18px 20px', textAlign: 'left',
        background: active ? T.surfaceActive : hov ? T.surfaceHover : T.surface,
        border: `1px solid ${isOn ? accentBorder : T.border}`,
        cursor: 'pointer', transition: 'all 0.15s linear', width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <Label>{label}</Label>
        <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accentTint }}>
          <Icon size={12} style={{ color: accentColor }} />
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 900, color: T.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </div>
      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        width: active ? '100%' : '0%',
        background: accentColor,
        transition: 'width 0.15s linear',
      }} />
    </button>
  )
}

/* ── Filter pill ──────────────────────────────────────────────────────── */
function FilterPill({ label, count, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        background: active ? T.cobaltTint : hov ? T.surfaceHover : 'transparent',
        border: `1px solid ${active ? T.cobaltBorder : hov ? T.borderStrong : T.border}`,
        borderLeft: active ? `2px solid ${T.cobalt}` : `1px solid ${active ? T.cobaltBorder : hov ? T.borderStrong : T.border}`,
        color: active ? T.cobalt : hov ? T.textSecondary : T.textMuted,
        cursor: 'pointer', transition: 'all 0.15s linear',
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          fontFamily: 'monospace', fontSize: 10,
          color: active ? T.cobalt : T.textMuted,
          background: active ? 'rgba(19,81,170,0.15)' : T.surfaceHover,
          padding: '0 5px', border: `1px solid ${active ? T.cobaltBorder : T.border}`,
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

/* ── Alert banner ─────────────────────────────────────────────────────── */
function AlertBanner({ msg, onClose }) {
  if (!msg) return null
  const ok = msg.type === 'success'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 16px', marginBottom: 20,
      background: ok ? T.emeraldTint : T.roseTint,
      border: `1px solid ${ok ? T.emeraldBorder : T.roseBorder}`,
      color: ok ? T.emerald : T.rose,
    }}>
      {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{msg.text}</span>
      <button onClick={onClose} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={13} />
      </button>
    </div>
  )
}

/* ── Team overview widget ─────────────────────────────────────────────── */
function TeamOverview({ goals, employees }) {
  if (!employees.length || !goals.length) return null

  const empStats = employees.map(emp => {
    const eg = goals.filter(g => g.employee_id === emp.id)
    const approved  = eg.filter(g => g.status === 'approved').length
    const submitted = eg.filter(g => g.status === 'submitted').length
    const total     = eg.length
    return { ...emp, total, approved, submitted, pending: submitted }
  }).filter(e => e.total > 0)

  if (!empStats.length) return null

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 2, height: 14, background: T.cobalt, flexShrink: 0 }} />
          <Label>Team Overview</Label>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: T.textMuted }}>
          {empStats.length} member{empStats.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Employee', 'Department', 'Total', 'Approved', 'Pending', 'Progress'].map(h => (
                <th key={h} style={{
                  padding: '8px 16px', textAlign: h === 'Progress' ? 'left' : h === 'Employee' || h === 'Department' ? 'left' : 'center',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: T.textMuted,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empStats.map((emp, i) => {
              const approvalRate = emp.total ? Math.round((emp.approved / emp.total) * 100) : 0
              return (
                <tr
                  key={emp.id}
                  style={{
                    borderBottom: i < empStats.length - 1 ? `1px solid ${T.border}` : 'none',
                    transition: 'background 0.1s linear',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 26, height: 26, flexShrink: 0,
                        background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: T.cobalt,
                      }}>
                        {emp.full_name?.charAt(0) ?? '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                        {emp.full_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{emp.department ?? '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: T.textSecondary }}>
                      {emp.total}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: T.emerald }}>
                      {emp.approved}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: emp.pending > 0 ? T.amber : T.textMuted }}>
                      {emp.pending}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 3, background: T.border, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${approvalRate}%`,
                          background: approvalRate === 100 ? T.emerald : approvalRate >= 50 ? T.cobalt : T.textMuted,
                          transition: 'width 0.4s linear',
                        }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: T.textMuted, minWidth: 28 }}>
                        {approvalRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   ManagerDashboard
════════════════════════════════════════════════════════════════════════ */
export default function ManagerDashboard() {
  const [goals, setGoals]         = useState([])
  const [employees, setEmployees] = useState([])
  const [filter, setFilter]       = useState('submitted')
  const [empFilter, setEmpFilter] = useState('all')
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg]             = useState(null)

  /* FIX 3 — global search from Layout header */
  const { searchQuery } = useContext(SearchContext)
  const [selFocus, setSelFocus]   = useState(false)

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
      if (action === 'reject')  await api.post(`/goals/${goalId}/reject`, { reason })
      setMsg({ type: 'success', text: `Goal ${action}d successfully` })
      fetchGoals()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Action failed' })
    }
  }

  /* Unchanged filter logic */
  const filtered = goals.filter(g => {
    const statusMatch = filter === 'all' || g.status === filter
    const empMatch    = empFilter === 'all' || g.employee_id === parseInt(empFilter)
    const q           = searchQuery.toLowerCase()
    const searchMatch = !q ||
      g.title?.toLowerCase().includes(q) ||
      g.employee?.full_name?.toLowerCase().includes(q) ||
      g.employee?.department?.toLowerCase().includes(q) ||
      g.status?.toLowerCase().includes(q)
    return statusMatch && empMatch && searchMatch
  })

  const counts = {
    all:       goals.length,
    submitted: goals.filter(g => g.status === 'submitted').length,
    approved:  goals.filter(g => g.status === 'approved').length,
    rejected:  goals.filter(g => g.status === 'rejected').length,
    draft:     goals.filter(g => g.status === 'draft').length,
  }

  const statCards = [
    { label: 'Total Goals',    value: counts.all,       key: 'all',       icon: BarChart3,   accentColor: T.textSecondary, accentTint: T.surfaceHover, accentBorder: T.borderStrong },
    { label: 'Pending Review', value: counts.submitted,  key: 'submitted', icon: Clock,       accentColor: T.amber,        accentTint: T.amberTint,    accentBorder: T.amberBorder  },
    { label: 'Approved',       value: counts.approved,   key: 'approved',  icon: CheckCircle, accentColor: T.emerald,      accentTint: T.emeraldTint,  accentBorder: T.emeraldBorder},
    { label: 'Rejected',       value: counts.rejected,   key: 'rejected',  icon: XCircle,     accentColor: T.rose,         accentTint: T.roseTint,     accentBorder: T.roseBorder   },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 20, paddingBottom: 28, marginBottom: 28,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 4, height: 16, background: T.cobalt, flexShrink: 0 }} />
            <Label color={T.cobalt}>Manager View</Label>
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 900, color: T.textPrimary,
            letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
          }}>
            Team Goals
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
            Review, approve and check-in on team objectives
          </p>
        </div>

        {/* Employee selector */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Label style={{ display: 'block', marginBottom: 6 }}>Filter by employee</Label>
          <select
            value={empFilter}
            onChange={e => setEmpFilter(e.target.value)}
            onFocus={() => setSelFocus(true)}
            onBlur={() => setSelFocus(false)}
            style={{
              padding: '8px 32px 8px 12px', fontSize: 12, fontWeight: 500,
              background: T.surface,
              border: `1px solid ${selFocus ? T.cobaltBorder : T.border}`,
              color: T.textPrimary, outline: 'none',
              cursor: 'pointer', appearance: 'none',
              transition: 'border-color 0.15s linear', minWidth: 180,
            }}
          >
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <ChevronDown size={12} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: T.textMuted, pointerEvents: 'none', marginTop: 9,
          }} />
        </div>
      </div>


      {/* FIX 3 — Global search active banner */}
      {searchQuery && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px', marginBottom: 20,
          background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
        }}>
          <span style={{ fontSize: 11, color: T.cobalt, fontWeight: 600 }}>
            Filtering for <strong>"{searchQuery}"</strong> — {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {/* ── Stat cards — clickable filters ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: T.border, marginBottom: 24 }}>
        {statCards.map(s => (
          <StatCard
            key={s.key}
            {...s}
            active={filter === s.key}
            onClick={() => setFilter(s.key)}
          />
        ))}
      </div>

      {/* ── Team overview table ── */}
      <TeamOverview goals={goals} employees={employees} />

      {/* ── Alert ── */}
      <AlertBanner msg={msg} onClose={() => setMsg(null)} />

      {/* ── Status filter pills ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1,
        background: T.border, marginBottom: 16, flexWrap: 'wrap',
      }}>
        {[
          { key: 'all',       label: 'All' },
          { key: 'submitted', label: 'Pending' },
          { key: 'approved',  label: 'Approved' },
          { key: 'rejected',  label: 'Rejected' },
          { key: 'draft',     label: 'Draft' },
        ].map(f => (
          <FilterPill
            key={f.key}
            label={f.label}
            count={counts[f.key]}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          />
        ))}
      </div>

      {/* ── Goals list ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, background: T.surface, animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '56px 24px', textAlign: 'center',
          border: `1px dashed ${T.borderStrong}`,
        }}>
          <Users size={28} style={{ color: T.textMuted, marginBottom: 14 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
            No goals for this filter
          </p>
          <p style={{ fontSize: 12, color: T.textMuted }}>
            Try a different status or employee selection
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border }}>
          {filtered.map(g => (
            <GoalRow key={g.id} goal={g} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
