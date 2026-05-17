import { useState, useEffect, useContext } from 'react'
import api from '../utils/api'
import { SearchContext } from '../components/Layout'
import {
  Download, Unlock, RefreshCw, TrendingUp,
  Users, Target, CheckCircle, BarChart3, X,
  AlertTriangle, CheckCircle2, Search,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'

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
}

const STATUS_META = {
  draft:     { label: 'Draft',    color: T.textMuted,  bg: T.surfaceHover, border: T.border,        chart: '#3b4252' },
  submitted: { label: 'Pending',  color: T.amber,      bg: T.amberTint,    border: T.amberBorder,   chart: T.amber   },
  approved:  { label: 'Approved', color: T.emerald,    bg: T.emeraldTint,  border: T.emeraldBorder, chart: T.emerald },
  rejected:  { label: 'Rejected', color: T.rose,       bg: T.roseTint,     border: T.roseBorder,    chart: T.rose    },
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function Label({ children, color }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.18em', fontWeight: 700,
      textTransform: 'uppercase', color: color ?? T.textMuted,
    }}>
      {children}
    </span>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.draft
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.13em', fontWeight: 700,
      textTransform: 'uppercase', padding: '2px 8px',
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  )
}

function Divider() {
  return <div style={{ height: 1, background: T.border }} />
}

/* ── Panel wrapper ────────────────────────────────────────────────────── */
function Panel({ title, subtitle, children, noPad }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 2, height: 14, background: T.cobalt, flexShrink: 0 }} />
          <Label>{title}</Label>
          {subtitle && (
            <span style={{ marginLeft: 4, fontSize: 10, color: T.textMuted }}>{subtitle}</span>
          )}
        </div>
      </div>
      <div style={noPad ? {} : { padding: '20px' }}>{children}</div>
    </div>
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
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
        <X size={13} />
      </button>
    </div>
  )
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, accentColor, accentTint, delta }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', padding: '20px',
        background: hov ? T.surfaceHover : T.surface,
        border: `1px solid ${hov ? T.borderStrong : T.border}`,
        transition: 'all 0.15s linear', cursor: 'default',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <Label>{label}</Label>
        <div style={{ width: 28, height: 28, background: accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color: accentColor }} />
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 38, fontWeight: 900, color: T.textPrimary, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
        {value ?? '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sub && <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{sub}</span>}
        {delta != null && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px',
            color: delta >= 0 ? T.emerald : T.rose,
            background: delta >= 0 ? T.emeraldTint : T.roseTint,
            border: `1px solid ${delta >= 0 ? T.emeraldBorder : T.roseBorder}`,
          }}>
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        width: hov ? '100%' : '0%', background: accentColor,
        transition: 'width 0.2s linear',
      }} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   FIX 1 — Bar chart with custom XAxis tick renderer so "Approved" label
   always renders. Recharts' SVG tick ignores CSS textTransform so we
   render the label manually through a custom tick component.
────────────────────────────────────────────────────────────────────── */
function CustomBarTick({ x, y, payload }) {
  const label = payload?.value ?? ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={12}
        textAnchor="middle"
        fill={T.textMuted}
        fontSize={9}
        fontWeight={700}
        fontFamily="'DM Sans', system-ui, sans-serif"
        letterSpacing="0.1em"
      >
        {label.toUpperCase()}
      </text>
    </g>
  )
}

function StatusChart({ stats }) {
  const data = stats ? [
    { name: 'Draft',    value: stats.draft,     fill: STATUS_META.draft.chart    },
    { name: 'Pending',  value: stats.submitted,  fill: STATUS_META.submitted.chart },
    { name: 'Approved', value: stats.approved,   fill: STATUS_META.approved.chart  },
    { name: 'Rejected', value: stats.rejected,   fill: STATUS_META.rejected.chart  },
  ] : []

  return (
    <Panel title="Status Distribution" subtitle="all goals">
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} barSize={40} barGap={2} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={T.border} strokeDasharray="0" />
          {/* FIX 1: custom tick component — label always renders */}
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={<CustomBarTick />}
            height={28}
          />
          <YAxis
            tick={{ fill: T.textMuted, fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div style={{
                  background: T.surface, border: `1px solid ${T.borderStrong}`,
                  padding: '10px 14px', minWidth: 110,
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>
                    {label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, background: payload[0]?.fill }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                      {payload[0]?.value}
                    </span>
                  </div>
                </div>
              )
            }}
            cursor={{ fill: T.surfaceHover }}
          />
          <Bar dataKey="value" radius={[0, 0, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   FIX 2 — CompletionRing: % text rendered OUTSIDE the SVG, to the right.
   No more absolute overlay that clips at small sizes.
────────────────────────────────────────────────────────────────────── */
function CompletionRing({ approved, total, size = 80 }) {
  const pct   = total ? Math.round((approved / total) * 100) : 0
  const r     = (size / 2) - 6
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ
  const cx    = size / 2
  const color = pct >= 80 ? T.emerald : pct >= 50 ? T.cobalt : T.amber

  return (
    /* Flex row: ring SVG on the left, % text on the right */
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <svg
        width={size} height={size}
        style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
      >
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={T.border} strokeWidth={5} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 0.5s linear' }}
        />
      </svg>
      {/* FIX 2: text sits beside the ring, never clipped */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: size <= 40 ? 11 : 14,
        fontWeight: 900,
        color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        minWidth: size <= 40 ? 28 : 36,
      }}>
        {pct}%
      </span>
    </div>
  )
}

/* ── Mini progress bar ────────────────────────────────────────────────── */
function MiniBar({ value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: T.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color ?? T.cobalt, transition: 'width 0.4s linear' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: T.textMuted, minWidth: 28 }}>
        {value}
      </span>
    </div>
  )
}

/* ── Completion rate panel ────────────────────────────────────────────── */
function CompletionPanel({ stats }) {
  if (!stats) return null
  const total    = stats.total_goals ?? 0
  const approved = stats.approved    ?? 0
  const pending  = stats.submitted   ?? 0
  const rejected = stats.rejected    ?? 0

  const rows = [
    { label: 'Approved', value: approved, color: T.emerald },
    { label: 'Pending',  value: pending,  color: T.amber   },
    { label: 'Rejected', value: rejected, color: T.rose    },
    { label: 'Draft',    value: stats.draft ?? 0, color: T.textMuted },
  ]

  return (
    <Panel title="Approval Rate" subtitle="current cycle">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {/* FIX 2 applied here — ring + external label */}
        <CompletionRing approved={approved} total={total} size={88} />
        <div style={{ flex: 1 }}>
          {rows.map(r => (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Label color={r.color}>{r.label}</Label>
                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
              <MiniBar value={r.value} max={total} color={r.color} />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

/* ── Employee roster ──────────────────────────────────────────────────── */
function EmployeeRoster({ employees, goals }) {
  return (
    <Panel title="Employee Roster" subtitle={`${employees.length} members`} noPad>
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {employees.map((e, i) => {
          const eg       = goals.filter(g => g.employee_id === e.id)
          const approved = eg.filter(g => g.status === 'approved').length
          const total    = eg.length

          return (
            <div key={e.id}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', transition: 'background 0.1s linear' }}
                onMouseEnter={ev => ev.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 30, height: 30, flexShrink: 0,
                  background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: T.cobalt,
                }}>
                  {e.full_name?.charAt(0) ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 2 }}>{e.full_name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{e.department ?? 'Unassigned'}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: T.emerald }}>{approved}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: T.textMuted }}>/{total}</span>
                </div>
                {/* FIX 2: ring text rendered outside, no clipping */}
                <CompletionRing approved={approved} total={total} size={32} />
              </div>
              {i < employees.length - 1 && <Divider />}
            </div>
          )
        })}
        {employees.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
            No employees found
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ── Goals table ──────────────────────────────────────────────────────── */
function UnlockButton({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: T.amber,
        background: hov ? 'rgba(251,191,36,0.15)' : T.amberTint,
        border: `1px solid ${T.amberBorder}`,
        cursor: 'pointer', transition: 'all 0.15s linear',
      }}
    >
      <Unlock size={10} />
      Unlock
    </button>
  )
}

function GoalsTable({ filtered, onUnlock }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            {['Employee', 'Goal', 'Target', 'UoM', 'Weight', 'Status', 'Actions'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: 'left',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: T.textMuted, whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(g => (
            <tr
              key={g.id}
              style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s linear' }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, flexShrink: 0,
                    background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: T.cobalt,
                  }}>
                    {g.employee?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: T.textPrimary, fontSize: 12 }}>{g.employee?.full_name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{g.employee?.department}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '13px 16px', maxWidth: 260 }}>
                <div style={{ fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.title}
                </div>
                {g.rejection_reason && (
                  <div style={{ fontSize: 10, color: T.rose, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ↳ {g.rejection_reason}
                  </div>
                )}
              </td>
              <td style={{ padding: '13px 16px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: T.textSecondary }}>{g.target}</span>
              </td>
              <td style={{ padding: '13px 16px' }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>{g.uom}</span>
              </td>
              <td style={{ padding: '13px 16px', minWidth: 110 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 3, background: T.border, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${Math.min(g.weightage, 100)}%`, background: T.cobalt }} />
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: T.cobalt }}>{g.weightage}%</span>
                </div>
              </td>
              <td style={{ padding: '13px 16px' }}>
                <StatusBadge status={g.status} />
              </td>
              <td style={{ padding: '13px 16px' }}>
                {(g.status === 'approved' || g.status === 'submitted') && (
                  <UnlockButton onClick={() => onUnlock(g.id, g.title)} />
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
                No goals match this filter
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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
        padding: '7px 14px', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        background: active ? T.cobaltTint : hov ? T.surfaceHover : 'transparent',
        border: `1px solid ${active ? T.cobaltBorder : hov ? T.borderStrong : T.border}`,
        borderLeft: active ? `2px solid ${T.cobalt}` : undefined,
        color: active ? T.cobalt : hov ? T.textSecondary : T.textMuted,
        cursor: 'pointer', transition: 'all 0.15s linear',
      }}
    >
      {label}
      <span style={{
        fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
        color: active ? T.cobalt : T.textMuted,
        background: active ? 'rgba(19,81,170,0.15)' : T.surfaceHover,
        padding: '0 5px', border: `1px solid ${active ? T.cobaltBorder : T.border}`,
      }}>
        {count}
      </span>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   AdminDashboard
════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [goals, setGoals]         = useState([])
  const [stats, setStats]         = useState(null)
  const [employees, setEmployees] = useState([])
  const [filter, setFilter]       = useState('all')
  const [empFilter, setEmpFilter] = useState('all')
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg]             = useState(null)
  const [localSearch, setLocalSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [selFocus, setSelFocus]   = useState(false)

  /* FIX 3 — consume global search from Layout context */
  const { searchQuery: globalSearch } = useContext(SearchContext)

  /* Combined search: local table search OR global header search */
  const activeSearch = localSearch || globalSearch

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

  /* Unchanged logic */
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await response.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'goals_report.csv'; a.click()
      URL.revokeObjectURL(url)
      setMsg({ type: 'success', text: 'CSV exported successfully' })
    } catch {
      setMsg({ type: 'error', text: 'Export failed' })
    }
  }

  /* FIX 3 — filter respects both local and global search */
  const filtered = goals.filter(g => {
    const statusMatch = filter === 'all' || g.status === filter
    const empMatch    = empFilter === 'all' || g.employee_id === parseInt(empFilter)
    const q           = activeSearch.toLowerCase()
    const searchMatch = !q ||
      g.title?.toLowerCase().includes(q) ||
      g.employee?.full_name?.toLowerCase().includes(q) ||
      g.employee?.department?.toLowerCase().includes(q) ||
      g.status?.toLowerCase().includes(q) ||
      g.uom?.toLowerCase().includes(q)
    return statusMatch && empMatch && searchMatch
  })

  const counts = {
    all:       goals.length,
    draft:     goals.filter(g => g.status === 'draft').length,
    submitted: goals.filter(g => g.status === 'submitted').length,
    approved:  goals.filter(g => g.status === 'approved').length,
    rejected:  goals.filter(g => g.status === 'rejected').length,
  }

  const approvalRate = stats?.total_goals
    ? Math.round((stats.approved / stats.total_goals) * 100)
    : 0

  /* Inline header button */
  const HeaderBtn = ({ onClick, icon: Icon, label, primary }) => {
    const [hov, setHov] = useState(false)
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          background: primary ? (hov ? T.cobaltHover : T.cobalt) : (hov ? T.surfaceHover : T.surface),
          border: primary ? 'none' : `1px solid ${hov ? T.borderStrong : T.border}`,
          color: primary ? '#f0f1f3' : hov ? T.textPrimary : T.textSecondary,
          cursor: 'pointer', transition: 'all 0.15s linear',
        }}
      >
        <Icon size={13} />{label}
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 20, paddingBottom: 28, marginBottom: 28,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 4, height: 16, background: T.amber, flexShrink: 0 }} />
            <Label color={T.amber}>System Administration</Label>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.textPrimary, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
            Full system overview · goal management · reporting
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <HeaderBtn onClick={fetchData}    icon={RefreshCw} label="Refresh" />
          <HeaderBtn onClick={handleExport} icon={Download}  label="Export CSV" primary />
        </div>
      </div>

      {/* ── FIX 3: Global search active banner ── */}
      {globalSearch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px', marginBottom: 20,
          background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
        }}>
          <Search size={12} style={{ color: T.cobalt, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.cobalt, fontWeight: 600 }}>
            Filtering for <strong>"{globalSearch}"</strong> — {filtered.length} goal{filtered.length !== 1 ? 's' : ''} match
          </span>
        </div>
      )}

      {/* ── KPI stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: T.border, marginBottom: 24 }}>
        {[
          { label: 'Employees',   value: stats?.total_employees, icon: Users,       accentColor: T.cobalt,        accentTint: T.cobaltTint,   sub: 'registered' },
          { label: 'Total Goals', value: stats?.total_goals,     icon: Target,      accentColor: T.textSecondary, accentTint: T.surfaceHover, sub: 'across all employees' },
          { label: 'Approved',    value: stats?.approved,        icon: CheckCircle, accentColor: T.emerald,       accentTint: T.emeraldTint,  sub: 'goals this cycle', delta: approvalRate },
          { label: 'Q Updates',   value: stats?.total_updates,   icon: TrendingUp,  accentColor: T.violet,        accentTint: T.violetTint,   sub: 'quarterly entries' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Analytics row: FIX 1 + FIX 2 both live here ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: T.border, marginBottom: 24 }}>
        <StatusChart stats={stats} />
        <CompletionPanel stats={stats} />

        {/* Needs Attention panel */}
        <Panel title="Needs Attention" subtitle="pending action">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Awaiting Review', value: counts.submitted, color: T.amber,    tip: 'Goals submitted by employees' },
              { label: 'Rejected Goals',  value: counts.rejected,  color: T.rose,     tip: 'Needs employee revision' },
              { label: 'Still in Draft',  value: counts.draft,     color: T.textMuted, tip: 'Not yet submitted' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: T.surfaceHover, border: `1px solid ${T.borderStrong}`,
              }}>
                <div>
                  <Label color={item.color}>{item.label}</Label>
                  <p style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{item.tip}</p>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: item.color, letterSpacing: '-0.03em' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Employee roster (FIX 2 applied inside) ── */}
      <div style={{ marginBottom: 24 }}>
        <EmployeeRoster employees={employees} goals={goals} />
      </div>

      <AlertBanner msg={msg} onClose={() => setMsg(null)} />

      {/* ── All Goals table ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            <div style={{ width: 2, height: 14, background: T.cobalt }} />
            <Label>All Goals</Label>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
              color: T.textMuted, background: T.surfaceHover,
              border: `1px solid ${T.border}`, padding: '0 6px',
            }}>
              {filtered.length}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* FIX 3 — local search input (also works alongside global) */}
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: T.textMuted, pointerEvents: 'none',
            }} />
            <input
              style={{
                padding: '7px 10px 7px 30px', fontSize: 11, width: 220,
                background: T.surfaceHover,
                border: `1px solid ${searchFocus ? T.cobaltBorder : T.border}`,
                color: T.textPrimary, outline: 'none',
                transition: 'border-color 0.15s linear',
              }}
              placeholder="Search goals or employees…"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                  display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Employee dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={empFilter}
              onChange={e => setEmpFilter(e.target.value)}
              onFocus={() => setSelFocus(true)}
              onBlur={() => setSelFocus(false)}
              style={{
                padding: '7px 28px 7px 10px', fontSize: 11, appearance: 'none',
                background: T.surfaceHover,
                border: `1px solid ${selFocus ? T.cobaltBorder : T.border}`,
                color: T.textPrimary, outline: 'none', cursor: 'pointer',
                transition: 'border-color 0.15s linear', minWidth: 160,
              }}
            >
              <option value="all">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
            <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 1, background: T.border, borderBottom: `1px solid ${T.border}` }}>
          {[
            { key: 'all',       label: 'All'      },
            { key: 'submitted', label: 'Pending'  },
            { key: 'approved',  label: 'Approved' },
            { key: 'rejected',  label: 'Rejected' },
            { key: 'draft',     label: 'Draft'    },
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

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border, padding: 1 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 56, background: T.surface, animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : (
          <GoalsTable filtered={filtered} onUnlock={handleUnlock} />
        )}
      </div>
    </div>
  )
}
