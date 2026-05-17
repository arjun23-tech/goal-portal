import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import {
  ChevronLeft, Save, MessageSquare,
  Target, TrendingUp, CheckCircle2,
  AlertCircle, Clock, Minus,
} from 'lucide-react'

/* ── Design tokens ────────────────────────────────────────────────────── */
const T = {
  pageBg:        '#0c0e12',
  surface:       '#111318',
  surfaceHover:  '#16191f',
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

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

/* ── Helpers ──────────────────────────────────────────────────────────── */
function Label({ children, color }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: color ?? T.textMuted,
    }}>
      {children}
    </span>
  )
}

function pct(achievement, target) {
  const n = parseFloat(achievement)
  const t = parseFloat(target)
  if (!t || isNaN(n)) return 0
  return Math.min(Math.round((n / t) * 100), 100)
}

function progressMeta(p) {
  if (p >= 100) return { color: T.emerald, tint: T.emeraldTint, border: T.emeraldBorder, label: 'Complete',    icon: CheckCircle2 }
  if (p >= 70)  return { color: T.cobalt,  tint: T.cobaltTint,  border: T.cobaltBorder,  label: 'On Track',   icon: TrendingUp }
  if (p >= 30)  return { color: T.amber,   tint: T.amberTint,   border: T.amberBorder,   label: 'At Risk',    icon: Clock }
  return              { color: T.rose,    tint: T.roseTint,    border: T.roseBorder,    label: 'Behind',     icon: AlertCircle }
}

/* ── Progress bar ─────────────────────────────────────────────────────── */
function ProgressBar({ value, target, height = 4, showPct = false }) {
  const p = pct(value, target)
  const m = progressMeta(p)
  return (
    <div>
      <div style={{ height, background: T.border, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${p}%`,
          background: m.color,
          transition: 'width 0.4s linear',
        }} />
      </div>
      {showPct && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <Label color={m.color}>{m.label}</Label>
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: m.color }}>
            {p}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Status pill ──────────────────────────────────────────────────────── */
function StatusPill({ achievement, target }) {
  const p = pct(achievement, target)
  const m = progressMeta(p)
  const Icon = m.icon
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: m.tint, border: `1px solid ${m.border}`, color: m.color,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      <Icon size={10} />
      {m.label}
    </div>
  )
}

/* ── Quarter tab ──────────────────────────────────────────────────────── */
function QuarterTab({ q, active, hasData, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', cursor: 'pointer',
        background: active ? T.cobaltTint : hov ? T.surfaceHover : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? T.cobalt : 'transparent'}`,
        color: active ? T.cobalt : hov ? T.textSecondary : T.textMuted,
        transition: 'all 0.15s linear',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {q}
      {hasData && (
        <span style={{
          width: 6, height: 6, flexShrink: 0,
          background: active ? T.cobalt : T.emerald,
          transition: 'background 0.15s linear',
        }} />
      )}
    </button>
  )
}

/* ── Achievement card (summary panel) ────────────────────────────────── */
function AchievementCard({ q, u, goal, isActive, onClick }) {
  const [hov, setHov] = useState(false)
  const hasData = Boolean(u)
  const p = hasData ? pct(u.achievement, goal.target) : 0
  const m = hasData ? progressMeta(p) : null

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '16px 18px', cursor: 'pointer',
        background: isActive ? T.cobaltTint : hov ? T.surfaceHover : T.surface,
        border: `1px solid ${isActive ? T.cobaltBorder : hov ? T.borderStrong : T.border}`,
        borderLeft: `3px solid ${isActive ? T.cobalt : hasData ? (m?.color ?? T.border) : T.border}`,
        transition: 'all 0.15s linear',
        opacity: !hasData ? 0.55 : 1,
      }}
    >
      {/* Quarter + status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Label color={isActive ? T.cobalt : T.textMuted}>{q}</Label>
          {isActive && (
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: T.cobalt,
              background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
              padding: '1px 6px',
            }}>
              Active
            </span>
          )}
        </div>
        {hasData
          ? <StatusPill achievement={u.achievement} target={goal.target} />
          : <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted }}>
              Not submitted
            </span>
        }
      </div>

      {/* Achievement value */}
      {hasData ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 24, fontWeight: 900,
              color: m?.color, letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {u.achievement}
            </span>
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
              {goal.uom}
            </span>
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>
              / {goal.target} target
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar value={u.achievement} target={goal.target} height={3} />

          {/* Notes */}
          {u.notes && (
            <p style={{
              marginTop: 10, fontSize: 11, color: T.textSecondary, lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {u.notes}
            </p>
          )}

          {/* Manager check-in */}
          {u.checkin_comment && (
            <div style={{
              marginTop: 10, padding: '8px 10px',
              background: T.violetTint, border: `1px solid ${T.violetBorder}`,
              display: 'flex', alignItems: 'flex-start', gap: 7,
            }}>
              <MessageSquare size={10} style={{ color: T.violet, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 10, color: T.violet, lineHeight: 1.4 }}>
                {u.checkin_comment}
              </p>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Minus size={12} style={{ color: T.textMuted }} />
          <span style={{ fontSize: 11, color: T.textMuted }}>Click to log this quarter</span>
        </div>
      )}
    </div>
  )
}

/* ── Overall progress strip ───────────────────────────────────────────── */
function OverallProgress({ updates, goal }) {
  const submitted = updates.length
  const totalAch  = updates.reduce((s, u) => s + parseFloat(u.achievement || 0), 0)
  const avgAch    = submitted ? totalAch / submitted : 0
  const avgPct    = pct(avgAch, goal.target)
  const m         = progressMeta(avgPct)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1, background: T.border, marginBottom: 24,
    }}>
      {[
        { label: 'Target',     value: `${goal.target} ${goal.uom}`, color: T.textSecondary },
        { label: 'Weight',     value: `${goal.weightage}%`,         color: T.cobalt },
        { label: 'Submitted',  value: `${submitted} / 4`,           color: T.textSecondary },
        { label: 'Avg Progress', value: `${avgPct}%`,               color: m.color },
      ].map(item => (
        <div key={item.label} style={{ padding: '14px 18px', background: T.surface }}>
          <Label>{item.label}</Label>
          <div style={{
            fontFamily: 'monospace', fontSize: 20, fontWeight: 900,
            color: item.color, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8,
          }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Form input helpers ───────────────────────────────────────────────── */
function FormInput({ value, onChange, placeholder, required, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, width: '100%', boxSizing: 'border-box',
          padding: suffix ? '11px 52px 11px 14px' : '11px 14px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13, fontWeight: 500,
          background: T.surfaceHover,
          border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
          color: T.textPrimary, outline: 'none',
          transition: 'border-color 0.15s linear',
          borderRadius: 0,
        }}
      />
      {suffix && (
        <span style={{
          position: 'absolute', right: 14,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          color: T.textMuted, pointerEvents: 'none',
        }}>
          {suffix}
        </span>
      )}
    </div>
  )
}

function FormTextarea({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px', height: 112, resize: 'none',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 13, fontWeight: 500, lineHeight: 1.55,
        background: T.surfaceHover,
        border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
        color: T.textPrimary, outline: 'none',
        transition: 'border-color 0.15s linear',
        borderRadius: 0,
      }}
    />
  )
}

/* ════════════════════════════════════════════════════════════════════════
   QuarterlyUpdate
════════════════════════════════════════════════════════════════════════ */
export default function QuarterlyUpdate() {
  const navigate        = useNavigate()
  const { id: goalId }  = useParams()
  const [goal, setGoal]     = useState(null)
  const [updates, setUpdates] = useState([])
  const [activeQ, setActiveQ] = useState('Q1')
  const [form, setForm]       = useState({ achievement: '', notes: '' })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [submitHov, setSubmitHov] = useState(false)

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

  /* Unchanged logic */
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
      setMsg({ type: 'success', text: `${activeQ} update saved` })
      fetchUpdates()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  /* Loading */
  if (!goal) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 200, gap: 10,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{
          width: 14, height: 14,
          border: `2px solid ${T.border}`,
          borderTopColor: T.cobalt,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>Loading goal…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const activeUpdate = getUpdate(activeQ)
  const activePct    = activeUpdate ? pct(activeUpdate.achievement, goal.target) : null

  return (
    <div style={{
      maxWidth: 980, margin: '0 auto',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        ::placeholder { color: ${T.textMuted}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Back ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 28, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: T.textMuted,
          transition: 'color 0.15s linear',
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
        onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
      >
        <ChevronLeft size={14} />
        Back to Dashboard
      </button>

      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{
        paddingBottom: 24, marginBottom: 24,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 4, height: 16, background: T.cobalt, flexShrink: 0 }} />
          <Label color={T.cobalt}>Quarterly Update</Label>
        </div>
        <h1 style={{
          fontSize: 22, fontWeight: 900, color: T.textPrimary,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8,
        }}>
          {goal.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={11} style={{ color: T.textMuted }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
              Target: <strong style={{ color: T.textSecondary }}>{goal.target} {goal.uom}</strong>
            </span>
          </div>
          <div style={{ width: 3, height: 3, background: T.border }} />
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
            Weight: <strong style={{ color: T.textSecondary }}>{goal.weightage}%</strong>
          </span>
          <div style={{ width: 3, height: 3, background: T.border }} />
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
            {updates.length}/4 quarters logged
          </span>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <OverallProgress updates={updates} goal={goal} />

      {/* ── Quarter tabs ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0,
        background: T.border,
        marginBottom: 20,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {QUARTERS.map(q => (
          <QuarterTab
            key={q}
            q={q}
            active={activeQ === q}
            hasData={Boolean(getUpdate(q))}
            onClick={() => selectQuarter(q)}
          />
        ))}
      </div>

      {/* ── Main content: form + summary ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.border, alignItems: 'start' }}>

        {/* ── Left: Entry form ────────────────────────────────────── */}
        <div style={{ background: T.surface }}>
          {/* Form header */}
          <div style={{
            padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 2, height: 14, background: T.cobalt, flexShrink: 0 }} />
              <Label color={T.cobalt}>{activeQ} Entry</Label>
            </div>
            {activeUpdate && (
              <StatusPill achievement={activeUpdate.achievement} target={goal.target} />
            )}
          </div>

          <form onSubmit={handleSave} style={{ padding: '22px' }}>

            {/* Achievement input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label>Achievement Value <span style={{ color: T.cobalt }}>*</span></Label>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
                  Target: <strong style={{ color: T.textSecondary, fontFamily: 'monospace' }}>{goal.target} {goal.uom}</strong>
                </span>
              </div>
              <FormInput
                value={form.achievement}
                onChange={e => setForm(f => ({ ...f, achievement: e.target.value }))}
                placeholder={`e.g. ${Math.round(goal.target * 0.8)}`}
                required
                suffix={goal.uom}
              />

              {/* Live progress preview */}
              {form.achievement && (
                <div style={{ marginTop: 10 }}>
                  <ProgressBar
                    value={form.achievement}
                    target={goal.target}
                    height={4}
                    showPct
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 7 }}>
                <Label>Notes & Commentary</Label>
              </div>
              <FormTextarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="What did you accomplish this quarter? Any blockers, context, or insights worth sharing with your manager…"
              />
            </div>

            {/* Message */}
            {msg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 16,
                background: msg.type === 'success' ? T.emeraldTint : T.roseTint,
                border: `1px solid ${msg.type === 'success' ? T.emeraldBorder : T.roseBorder}`,
                color: msg.type === 'success' ? T.emerald : T.rose,
              }}>
                {msg.type === 'success'
                  ? <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                  : <AlertCircle size={13} style={{ flexShrink: 0 }} />}
                <span style={{ fontSize: 12, fontWeight: 500 }}>{msg.text}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              onMouseEnter={() => setSubmitHov(true)}
              onMouseLeave={() => setSubmitHov(false)}
              style={{
                width: '100%', padding: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase',
                background: saving ? T.surfaceHover : submitHov ? T.cobaltHover : T.cobalt,
                color: saving ? T.textMuted : '#f0f1f3',
                border: saving ? `1px solid ${T.border}` : 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s linear',
                borderRadius: 0,
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: 12, height: 12,
                    border: `2px solid ${T.textMuted}`,
                    borderTopColor: T.textSecondary,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save {activeQ} Update
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Right: All quarters summary ─────────────────────────── */}
        <div style={{ background: T.surface }}>
          {/* Panel header */}
          <div style={{
            padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 2, height: 14, background: T.cobalt, flexShrink: 0 }} />
              <Label>Progress Summary</Label>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: T.textMuted }}>
              {updates.length}/4 logged
            </span>
          </div>

          {/* Achievement cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border, padding: 1 }}>
            {QUARTERS.map(q => (
              <AchievementCard
                key={q}
                q={q}
                u={getUpdate(q)}
                goal={goal}
                isActive={activeQ === q}
                onClick={() => selectQuarter(q)}
              />
            ))}
          </div>

          {/* Annual trajectory footer */}
          {updates.length >= 2 && (
            <div style={{ padding: '18px 22px', borderTop: `1px solid ${T.border}` }}>
              <div style={{ marginBottom: 12 }}>
                <Label>Annual Trajectory</Label>
              </div>
              <div style={{ display: 'flex', gap: 1, background: T.border }}>
                {QUARTERS.map(q => {
                  const u = getUpdate(q)
                  const p = u ? pct(u.achievement, goal.target) : 0
                  const m = u ? progressMeta(p) : null
                  return (
                    <div
                      key={q}
                      style={{ flex: 1, background: T.surfaceHover, padding: '10px 12px' }}
                    >
                      <Label color={activeQ === q ? T.cobalt : T.textMuted}>{q}</Label>
                      {u ? (
                        <>
                          <div style={{
                            fontFamily: 'monospace', fontSize: 15, fontWeight: 900,
                            color: m.color, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1,
                          }}>
                            {p}%
                          </div>
                          <div style={{ marginTop: 6, height: 2, background: T.border, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p}%`, background: m.color, transition: 'width 0.4s linear' }} />
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: 6 }}>
                          <Minus size={14} style={{ color: T.textMuted }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
