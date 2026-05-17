import { useState, useEffect, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SearchContext } from '../components/Layout'
import GoalCard from '../components/GoalCard'
import api from '../utils/api'
import {
  Plus, Send, AlertTriangle, CheckCircle2, TrendingUp,
  Target, Clock, XCircle, FileText, RefreshCw,
  BarChart3, Flame, ChevronRight,
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
  emeraldTint:   'rgba(52,211,153,0.10)',
  emeraldBorder: 'rgba(52,211,153,0.20)',
  amber:         '#fbbf24',
  amberTint:     'rgba(251,191,36,0.10)',
  amberBorder:   'rgba(251,191,36,0.20)',
  rose:          '#f87171',
  roseTint:      'rgba(248,113,113,0.08)',
  roseBorder:    'rgba(248,113,113,0.18)',
}

/* ── Greeting ─────────────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Label — Modernist section metadata ───────────────────────────────── */
function Label({ children, color }) {
  return (
    <span
      className="font-bold uppercase"
      style={{
        fontSize: 9,
        letterSpacing: '0.18em',
        color: color ?? T.textMuted,
      }}
    >
      {children}
    </span>
  )
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ label, value, max, icon: Icon, accentColor, accentTint, accentBorder, sublabel }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative overflow-hidden p-5 cursor-default"
      style={{
        background: hovered ? T.surfaceHover : T.surface,
        border: `1px solid ${hovered ? accentBorder : T.border}`,
        transition: 'all 0.15s linear',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between mb-4">
        <Label>{label}</Label>
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{ background: accentTint }}
        >
          <Icon size={13} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value — compressed Modernist type */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-black leading-none tabular-nums"
          style={{ fontSize: 36, color: T.textPrimary, letterSpacing: '-0.04em' }}
        >
          {value}
        </span>
        {max != null && (
          <span
            className="font-mono font-medium"
            style={{ fontSize: 13, color: T.textMuted }}
          >
            /{max}
          </span>
        )}
      </div>

      {sublabel && (
        <p
          className="mt-2 text-xs font-medium"
          style={{ color: T.textMuted }}
        >
          {sublabel}
        </p>
      )}

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 h-px transition-all duration-150"
        style={{
          width: hovered ? '100%' : '0%',
          background: accentColor,
        }}
      />
    </div>
  )
}

/* ── Weight gauge — SVG half-arc ──────────────────────────────────────── */
function WeightGauge({ total }) {
  const pct   = Math.min(total, 100)
  const ok    = Math.abs(total - 100) < 0.01
  const over  = total > 100
  const color = ok ? T.emerald : over ? T.rose : T.amber
  const track = ok ? 'rgba(52,211,153,0.12)' : over ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)'

  const r = 26, cx = 34, cy = 34, sw = 5
  const circ = Math.PI * r
  const dash  = (pct / 100) * circ

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: 68, height: 38 }}>
        <svg viewBox="0 0 68 40" style={{ width: 68, height: 40, overflow: 'visible' }}>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke={track} strokeWidth={sw} strokeLinecap="butt"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="butt"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.4s linear' }}
          />
        </svg>
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ bottom: 0 }}
        >
          <span
            className="font-black font-mono leading-none"
            style={{ fontSize: 13, color, letterSpacing: '-0.02em' }}
          >
            {total.toFixed(0)}%
          </span>
        </div>
      </div>
      <div>
        <Label>Draft weight</Label>
        <p
          className="text-xs font-semibold mt-0.5"
          style={{ color: ok ? T.emerald : over ? T.rose : T.amber }}
        >
          {ok ? 'Ready to submit' : over ? `Over by ${(total - 100).toFixed(0)}%` : `${(100 - total).toFixed(0)}% to go`}
        </p>
      </div>
    </div>
  )
}

/* ── Distribution bar ─────────────────────────────────────────────────── */
function DistributionBar({ draft, submitted, approved, rejected, total }) {
  if (!total) return null
  const segs = [
    { n: approved,  color: T.emerald, label: 'Approved'  },
    { n: submitted, color: T.amber,   label: 'Pending'   },
    { n: draft,     color: '#3b4252', label: 'Draft'     },
    { n: rejected,  color: T.rose,    label: 'Rejected'  },
  ].filter(s => s.n > 0)

  return (
    <div
      className="p-5"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Label>Goal distribution</Label>
        <span className="font-mono font-medium" style={{ fontSize: 11, color: T.textMuted }}>
          {total} total
        </span>
      </div>

      {/* Stacked bar — flat, no radius */}
      <div className="flex h-1.5 gap-px mb-4" style={{ background: T.border }}>
        {segs.map(s => (
          <div
            key={s.label}
            style={{
              background: s.color,
              width: `${(s.n / total) * 100}%`,
              transition: 'width 0.4s linear',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segs.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2 h-2 shrink-0" style={{ background: s.color }} />
            <Label>{s.label}</Label>
            <span
              className="font-mono font-bold ml-0.5"
              style={{ fontSize: 11, color: T.textSecondary }}
            >
              {s.n}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Cycle checklist ──────────────────────────────────────────────────── */
function CycleChecklist({ goals, draftGoals, weightOk, submittedGoals, approvedGoals }) {
  const steps = [
    { done: goals.length > 0,                                  label: 'Create at least one goal' },
    { done: weightOk && draftGoals.length > 0,                 label: 'Set draft weights to 100%' },
    { done: submittedGoals.length > 0 || approvedGoals.length > 0, label: 'Submit goals for review' },
    { done: approvedGoals.length > 0,                          label: 'Manager approval received' },
  ]
  const done = steps.filter(s => s.done).length

  return (
    <div
      className="p-5"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Label>Cycle checklist</Label>
        <span
          className="font-mono font-bold"
          style={{ fontSize: 11, color: done === steps.length ? T.emerald : T.textMuted }}
        >
          {done}/{steps.length}
        </span>
      </div>

      <ul className="space-y-2.5">
        {steps.map(({ done, label }, i) => (
          <li key={i} className="flex items-center gap-3">
            <div
              className="w-4 h-4 shrink-0 flex items-center justify-center font-black"
              style={{
                background: done ? T.emeraldTint : T.surfaceHover,
                border: `1px solid ${done ? T.emeraldBorder : T.borderStrong}`,
                fontSize: 9,
                color: done ? T.emerald : T.textMuted,
              }}
            >
              {done ? '✓' : '·'}
            </div>
            <span
              className="text-xs font-medium"
              style={{
                color: done ? T.textMuted : T.textSecondary,
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: T.textMuted,
              }}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Section heading — Modernist label-sidebar pattern ────────────────── */
function SectionHeader({ dotColor, label, count }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {/* Left border accent */}
      <div className="w-0.5 h-4 shrink-0" style={{ background: dotColor }} />
      <Label color={dotColor}>{label}</Label>
      <span
        className="font-mono font-bold px-1.5 py-0.5"
        style={{
          fontSize: 10,
          color: T.textMuted,
          background: T.surfaceHover,
          border: `1px solid ${T.border}`,
        }}
      >
        {count}
      </span>
      {/* Full-width divider */}
      <div className="flex-1 h-px" style={{ background: T.border }} />
    </div>
  )
}

/* ── Alert ────────────────────────────────────────────────────────────── */
function AlertBanner({ msg, onClose }) {
  if (!msg) return null
  const ok = msg.type === 'success'
  return (
    <div
      className="flex items-center gap-3 text-sm px-4 py-3 mb-6"
      style={{
        background: ok ? T.emeraldTint : T.roseTint,
        border: `1px solid ${ok ? T.emeraldBorder : T.roseBorder}`,
        color: ok ? T.emerald : T.rose,
      }}
    >
      {ok
        ? <CheckCircle2 size={14} className="shrink-0" />
        : <AlertTriangle size={14} className="shrink-0" />}
      <span className="flex-1 text-xs font-medium">{msg.text}</span>
      <button onClick={onClose} style={{ color: T.textMuted, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
        onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
        <XCircle size={13} />
      </button>
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────────────────────── */
function EmptyState({ onNew }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      style={{ border: `1px dashed ${T.borderStrong}` }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center mb-6"
        style={{ background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}` }}
      >
        <Target size={22} style={{ color: T.cobalt }} />
      </div>
      <h3
        className="font-black tracking-tight mb-2"
        style={{ fontSize: 18, color: T.textPrimary, letterSpacing: '-0.02em' }}
      >
        No goals defined
      </h3>
      <p className="text-xs font-medium mb-7" style={{ color: T.textMuted, maxWidth: 260 }}>
        Define your objectives for this performance cycle and submit them for manager review.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors duration-150"
        style={{
          background: T.cobalt,
          color: '#f0f1f3',
          letterSpacing: '0.06em',
        }}
        onMouseEnter={e => e.currentTarget.style.background = T.cobaltHover}
        onMouseLeave={e => e.currentTarget.style.background = T.cobalt}
      >
        <Plus size={14} />
        Create First Goal
      </button>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, height: 120 }} />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Main
════════════════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]               = useState(null)

  /* FIX 3 — global search from Layout header */
  const { searchQuery } = useContext(SearchContext)
  const applySearch = (list) => {
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(g =>
      g.title?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.status?.toLowerCase().includes(q) ||
      g.uom?.toLowerCase().includes(q)
    )
  }

  const fetchGoals = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/my')
      setGoals(data)
    } catch {
      setMsg({ type: 'error', text: 'Failed to load goals' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  /* ── Derived state — unchanged logic ── */
  const draftGoals     = applySearch(goals.filter(g => g.status === 'draft'))
  const submittedGoals = applySearch(goals.filter(g => g.status === 'submitted'))
  const approvedGoals  = applySearch(goals.filter(g => g.status === 'approved'))
  const rejectedGoals  = applySearch(goals.filter(g => g.status === 'rejected'))

  const totalWeight = draftGoals.reduce((s, g) => s + g.weightage, 0)
  const weightOk    = Math.abs(totalWeight - 100) < 0.01
  const canAdd      = goals.filter(g => g.status !== 'deleted').length < 8
  const canSubmit   = draftGoals.length > 0 && weightOk

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

  const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} · ${new Date().getFullYear()}`

  return (
    <div className="max-w-6xl mx-auto" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* FIX 3 — Global search active banner */}
      {searchQuery && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px', marginBottom: 20,
          background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
        }}>
          <span style={{ fontSize: 11, color: T.cobalt, fontWeight: 600 }}>
            Filtering for <strong>"{searchQuery}"</strong>
          </span>
        </div>
      )}


      {/* ── Page header ───────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-7 mb-8"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <div>
          {/* Modernist eyebrow label */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-1 h-4 shrink-0" style={{ background: T.cobalt }} />
            <Label color={T.cobalt}>{greeting()}, {user?.full_name?.split(' ')[0]}</Label>
          </div>

          <h1
            className="font-black leading-none tracking-tight"
            style={{ fontSize: 28, color: T.textPrimary, letterSpacing: '-0.03em' }}
          >
            My Goals
          </h1>
          <p className="text-sm font-medium mt-1.5" style={{ color: T.textMuted }}>
            {quarter} Performance Cycle
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchGoals}
            className="w-9 h-9 flex items-center justify-center transition-colors duration-150"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          {canAdd && (
            <button
              onClick={() => navigate('/goals/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase transition-colors duration-150"
              style={{ background: T.cobalt, color: '#f0f1f3', letterSpacing: '0.06em' }}
              onMouseEnter={e => e.currentTarget.style.background = T.cobaltHover}
              onMouseLeave={e => e.currentTarget.style.background = T.cobalt}
            >
              <Plus size={14} />
              New Goal
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-8"
        style={{ background: T.border }}>
        {[
          {
            label: 'Total Goals', value: goals.length, max: 8,
            icon: BarChart3,
            sublabel: `${8 - goals.filter(g => g.status !== 'deleted').length} slots available`,
            accentColor: T.textSecondary, accentTint: T.surfaceHover, accentBorder: T.borderStrong,
          },
          {
            label: 'Draft', value: draftGoals.length,
            icon: FileText,
            sublabel: draftGoals.length ? 'Needs submission' : 'Nothing in draft',
            accentColor: T.textSecondary, accentTint: T.surfaceHover, accentBorder: T.borderStrong,
          },
          {
            label: 'Pending Review', value: submittedGoals.length,
            icon: Clock,
            sublabel: submittedGoals.length ? 'With your manager' : 'None pending',
            accentColor: T.amber, accentTint: T.amberTint, accentBorder: T.amberBorder,
          },
          {
            label: 'Approved', value: approvedGoals.length,
            icon: Flame,
            sublabel: approvedGoals.length ? 'Active objectives' : 'None approved yet',
            accentColor: T.emerald, accentTint: T.emeraldTint, accentBorder: T.emeraldBorder,
          },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Analytics widgets ──────────────────────────────────────── */}
      {goals.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-px mb-8" style={{ background: T.border }}>
          <DistributionBar
            draft={draftGoals.length} submitted={submittedGoals.length}
            approved={approvedGoals.length} rejected={rejectedGoals.length}
            total={goals.length}
          />
          <CycleChecklist
            goals={goals} draftGoals={draftGoals} weightOk={weightOk}
            submittedGoals={submittedGoals} approvedGoals={approvedGoals}
          />
        </div>
      )}

      {/* ── Alert ─────────────────────────────────────────────────── */}
      <AlertBanner msg={msg} onClose={() => setMsg(null)} />

      {/* ── Loading ───────────────────────────────────────────────── */}
      {loading && <Skeleton />}

      {/* ── Draft Goals ───────────────────────────────────────────── */}
      {!loading && draftGoals.length > 0 && (
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <SectionHeader dotColor={T.textMuted} label="Draft Goals" count={draftGoals.length} />
            <WeightGauge total={totalWeight} />
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px mb-5" style={{ background: T.border }}>
            {draftGoals.map(g => (
              <GoalCard key={g.id} goal={g}
                onEdit={g => navigate(`/goals/${g.id}/edit`)}
                onDelete={handleDelete} />
            ))}
          </div>

          {/* Weight warning */}
          {!weightOk && (
            <div
              className="flex items-start gap-3 px-4 py-3 mb-5"
              style={{ background: T.amberTint, border: `1px solid ${T.amberBorder}` }}
            >
              <AlertTriangle size={14} style={{ color: T.amber, marginTop: 1, flexShrink: 0 }} />
              <p className="text-xs font-medium" style={{ color: T.amber }}>
                Total weightage is{' '}
                <strong className="font-mono">{totalWeight.toFixed(1)}%</strong>.
                {' '}Adjust to exactly <strong>100%</strong> before submitting.
              </p>
            </div>
          )}

          {/* Submit row */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors duration-150"
              style={{
                background: canSubmit && !submitting ? T.cobalt : T.surfaceHover,
                color: canSubmit && !submitting ? '#f0f1f3' : T.textMuted,
                letterSpacing: '0.06em',
                border: `1px solid ${canSubmit && !submitting ? 'transparent' : T.border}`,
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => { if (canSubmit && !submitting) e.currentTarget.style.background = T.cobaltHover }}
              onMouseLeave={e => { if (canSubmit && !submitting) e.currentTarget.style.background = T.cobalt }}
            >
              {submitting
                ? <><RefreshCw size={13} className="animate-spin" />Submitting…</>
                : <><Send size={13} />Submit for Review</>}
            </button>

            {!canSubmit && !submitting && (
              <p className="text-xs font-medium" style={{ color: T.textMuted }}>
                {!weightOk ? 'Balance draft weights to 100% first' : 'Add at least one draft goal'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Submitted ─────────────────────────────────────────────── */}
      {!loading && submittedGoals.length > 0 && (
        <section className="mb-10">
          <SectionHeader dotColor={T.amber} label="Pending Review" count={submittedGoals.length} />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px" style={{ background: T.border }}>
            {submittedGoals.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </section>
      )}

      {/* ── Approved ──────────────────────────────────────────────── */}
      {!loading && approvedGoals.length > 0 && (
        <section className="mb-10">
          <SectionHeader dotColor={T.emerald} label="Approved Goals" count={approvedGoals.length} />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px" style={{ background: T.border }}>
            {approvedGoals.map(g => (
              <GoalCard key={g.id} goal={g}
                onUpdate={g => navigate(`/goals/${g.id}/update`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Rejected ──────────────────────────────────────────────── */}
      {!loading && rejectedGoals.length > 0 && (
        <section className="mb-10">
          <SectionHeader dotColor={T.rose} label="Needs Revision" count={rejectedGoals.length} />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px" style={{ background: T.border }}>
            {rejectedGoals.map(g => (
              <GoalCard key={g.id} goal={g}
                onEdit={g => navigate(`/goals/${g.id}/edit`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty ─────────────────────────────────────────────────── */}
      {!loading && goals.length === 0 && (
        <EmptyState onNew={() => navigate('/goals/new')} />
      )}
    </div>
  )
}

