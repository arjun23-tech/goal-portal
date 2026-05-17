import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Save, AlertCircle, ChevronLeft, Target, Hash, Scale, BarChart3 } from 'lucide-react'

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
}

const UOM_OPTIONS = [
  '%', 'Number', 'Score', 'Rating (1-5)',
  'Hours', 'Days', 'Sessions', 'Projects',
  'Certifications', 'Bugs', '$ Revenue', 'NPS Score', 'Custom',
]

/* ── Micro helpers ────────────────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: T.textMuted,
      }}>
        {children}
      </span>
      {required && (
        <span style={{ fontSize: 9, color: T.cobalt, fontWeight: 700 }}>*</span>
      )}
    </div>
  )
}

function FieldWrap({ children, hint }) {
  return (
    <div>
      {children}
      {hint && (
        <p style={{ marginTop: 6, fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function SectionDivider({ icon: Icon, label, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      paddingBottom: 20, marginBottom: 4,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        background: T.cobaltTint, border: `1px solid ${T.cobaltBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} style={{ color: T.cobalt }} />
      </div>
      <div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: T.cobalt,
        }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{
        fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
        color: T.textMuted,
      }}>
        {index}
      </span>
    </div>
  )
}

/* ── Input / textarea / select base ──────────────────────────────────── */
function Input({ value, onChange, placeholder, required, type = 'text', autoFocus, onBlur }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 13, fontWeight: 500,
        background: T.surfaceHover,
        border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
        color: T.textPrimary, outline: 'none',
        transition: 'border-color 0.15s linear',
        borderRadius: 0,
      }}
    />
  )
}

function Textarea({ value, onChange, placeholder }) {
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
        padding: '11px 14px', height: 96, resize: 'none',
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

function Select({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 36px 11px 14px', appearance: 'none',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13, fontWeight: 500,
          background: T.surfaceHover,
          border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
          color: T.textPrimary, outline: 'none', cursor: 'pointer',
          transition: 'border-color 0.15s linear',
          borderRadius: 0,
        }}
      >
        {children}
      </select>
      <svg
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="12" height="12" viewBox="0 0 12 12" fill="none"
      >
        <path d="M2 4L6 8L10 4" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    </div>
  )
}

/* ── Weightage indicator ──────────────────────────────────────────────── */
function WeightIndicator({ currentTotal }) {
  const ok   = Math.abs(currentTotal - 100) < 0.01
  const over = currentTotal > 100
  const color  = ok ? T.emerald : over ? T.rose : T.amber
  const tint   = ok ? T.emeraldTint : over ? T.roseTint : T.amberTint
  const border = ok ? T.emeraldBorder : over ? T.roseBorder : T.amberBorder
  const label  = ok ? 'Ready' : over ? 'Over budget' : 'In progress'
  const pct    = Math.min(currentTotal, 100)

  return (
    <div style={{ marginTop: 14 }}>
      {/* Track */}
      <div style={{
        position: 'relative', height: 4, background: T.border, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${pct}%`,
          background: color,
          transition: 'width 0.3s linear, background 0.15s linear',
        }} />
      </div>

      {/* Labels row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '2px 8px',
            color, background: tint, border: `1px solid ${border}`,
          }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
            Min per goal: 10%
          </span>
        </div>
        <span style={{
          fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
          color, letterSpacing: '-0.01em',
        }}>
          {currentTotal.toFixed(0)}<span style={{ color: T.textMuted, fontSize: 11 }}>/100%</span>
        </span>
      </div>
    </div>
  )
}

/* ── Slider ───────────────────────────────────────────────────────────── */
function WeightSlider({ value, onChange, min, max }) {
  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .gf-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 3px;
          background: transparent; outline: none; cursor: pointer;
        }
        .gf-slider::-webkit-slider-runnable-track {
          height: 3px; background: ${T.border};
        }
        .gf-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 0;
          background: ${T.cobalt}; border: 2px solid ${T.cobalt};
          margin-top: -5.5px; cursor: pointer;
          transition: background 0.15s linear;
        }
        .gf-slider::-webkit-slider-thumb:hover {
          background: ${T.cobaltHover};
        }
        .gf-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 0;
          background: ${T.cobalt}; border: 2px solid ${T.cobalt};
          cursor: pointer;
        }
        .gf-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px ${T.cobaltTint};
        }
      `}</style>
      <input
        type="range" className="gf-slider"
        min={min} max={Math.max(min, max)} step={5}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   GoalForm
════════════════════════════════════════════════════════════════════════ */
export default function GoalForm() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const isEdit    = Boolean(id)

  const [form, setForm]           = useState({ title: '', description: '', target: '', uom: '%', weightage: 10 })
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [customUom, setCustomUom] = useState(false)
  const [myGoals, setMyGoals]     = useState([])
  const [submitHov, setSubmitHov] = useState(false)
  const [cancelHov, setCancelHov] = useState(false)

  useEffect(() => {
    api.get('/goals/my').then(r => {
      setMyGoals(r.data)
      if (isEdit) {
        const g = r.data.find(g => g.id === parseInt(id))
        if (g) setForm({ title: g.title, description: g.description, target: g.target, uom: g.uom, weightage: g.weightage })
      }
    })
  }, [id, isEdit])

  /* Unchanged weight logic */
  const totalOtherWeight = myGoals
    .filter(g => g.status === 'draft' && (!isEdit || g.id !== parseInt(id)))
    .reduce((s, g) => s + g.weightage, 0)
  const remaining    = 100 - totalOtherWeight
  const currentTotal = totalOtherWeight + Number(form.weightage)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.weightage < 10) { setError('Weightage must be at least 10%'); return }
    setSaving(true)
    try {
      if (isEdit) await api.put(`/goals/${id}`, form)
      else        await api.post('/goals', form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        ::placeholder { color: ${T.textMuted}; }
        select option  { background: #16191f; color: ${T.textPrimary}; }
      `}</style>

      {/* ── Back link ─────────────────────────────────────────────── */}
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
        Back
      </button>

      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{
        paddingBottom: 24, marginBottom: 28,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 4, height: 16, background: T.cobalt, flexShrink: 0 }} />
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.cobalt,
          }}>
            {isEdit ? 'Edit Objective' : 'New Objective'}
          </span>
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 900, color: T.textPrimary,
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8,
        }}>
          {isEdit ? 'Update Goal' : 'Define a Goal'}
        </h1>
        <p style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, lineHeight: 1.5 }}>
          Each goal needs at least <strong style={{ color: T.textSecondary }}>10% weightage</strong>.
          {' '}Your draft goals must total exactly <strong style={{ color: T.textSecondary }}>100%</strong> before submitting.
        </p>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
      }}>
        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Objective details ── */}
          <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${T.border}` }}>
            <SectionDivider icon={Target} label="Objective Details" index="01" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Title */}
              <FieldWrap hint="Write a clear, measurable objective — e.g. 'Improve customer satisfaction score to 90%'">
                <Label required>Goal Title</Label>
                <Input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Improve Customer Satisfaction Score"
                  required
                  autoFocus
                />
              </FieldWrap>

              {/* Description */}
              <FieldWrap hint="Describe what success looks like — how will you know when you've achieved this?">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the context, approach, and definition of success for this goal…"
                />
              </FieldWrap>
            </div>
          </div>

          {/* ── Section 2: Measurement ── */}
          <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${T.border}` }}>
            <SectionDivider icon={Hash} label="Measurement" index="02" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Target */}
              <FieldWrap hint="The numeric value you're aiming to reach by year-end">
                <Label required>Target Value</Label>
                <Input
                  value={form.target}
                  onChange={e => set('target', e.target.value)}
                  placeholder="e.g. 90"
                  required
                />
              </FieldWrap>

              {/* UoM */}
              <FieldWrap hint="How will this target be measured?">
                <Label required>Unit of Measurement</Label>
                {!customUom ? (
                  <Select
                    value={form.uom}
                    onChange={e => {
                      if (e.target.value === 'Custom') { setCustomUom(true); set('uom', '') }
                      else set('uom', e.target.value)
                    }}
                  >
                    {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </Select>
                ) : (
                  <Input
                    value={form.uom}
                    onChange={e => set('uom', e.target.value)}
                    placeholder="Enter custom unit…"
                    onBlur={() => { if (!form.uom) setCustomUom(false) }}
                    autoFocus
                    required
                  />
                )}
              </FieldWrap>
            </div>
          </div>

          {/* ── Section 3: Weightage ── */}
          <div style={{ padding: '24px 28px 28px' }}>
            <SectionDivider icon={Scale} label="Weightage" index="03" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Slider + numeric input row */}
              <div>
                <Label required>Weight Allocation (%)</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>

                  {/* Slider */}
                  <div style={{ flex: 1 }}>
                    <WeightSlider
                      value={form.weightage}
                      min={10}
                      max={remaining}
                      onChange={e => set('weightage', Number(e.target.value))}
                    />
                  </div>

                  {/* Numeric input */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <input
                      type="number" min={10} max={100} step={1}
                      value={form.weightage}
                      onChange={e => set('weightage', Number(e.target.value))}
                      style={{
                        width: 80, padding: '9px 28px 9px 12px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 16, fontWeight: 700,
                        textAlign: 'right',
                        background: T.surfaceHover,
                        border: `1px solid ${T.border}`,
                        color: T.textPrimary, outline: 'none',
                        borderRadius: 0,
                        transition: 'border-color 0.15s linear',
                      }}
                      onFocus={e => e.target.style.borderColor = T.cobaltBorder}
                      onBlur={e => e.target.style.borderColor = T.border}
                    />
                    <span style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                      color: T.textMuted, pointerEvents: 'none',
                    }}>%</span>
                  </div>
                </div>

                {/* Budget summary row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 1, background: T.border, marginBottom: 4,
                }}>
                  {[
                    { label: 'This goal', value: `${form.weightage}%`, color: T.cobalt },
                    { label: 'Other drafts', value: `${totalOtherWeight}%`, color: T.textSecondary },
                    { label: 'Remaining budget', value: `${Math.max(0, remaining - form.weightage)}%`, color: T.textMuted },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: '10px 14px',
                      background: T.surfaceHover,
                    }}>
                      <div style={{
                        fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                        color: item.color, letterSpacing: '-0.02em', lineHeight: 1,
                      }}>
                        {item.value}
                      </div>
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: T.textMuted, marginTop: 5,
                      }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <WeightIndicator currentTotal={currentTotal} />
              </div>
            </div>
          </div>

          {/* ── Error ─────────────────────────────────────────────── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 28px', margin: '0',
              background: T.roseTint, borderTop: `1px solid ${T.roseBorder}`,
              borderBottom: `1px solid ${T.roseBorder}`,
            }}>
              <AlertCircle size={13} style={{ color: T.rose, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: T.rose }}>{error}</span>
            </div>
          )}

          {/* ── Actions ───────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '20px 28px',
            background: T.pageBg,
            borderTop: `1px solid ${T.border}`,
          }}>
            {/* Primary CTA */}
            <button
              type="submit"
              disabled={saving}
              onMouseEnter={() => setSubmitHov(true)}
              onMouseLeave={() => setSubmitHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
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
                  {isEdit ? 'Save Changes' : 'Create Goal'}
                </>
              )}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              onMouseEnter={() => setCancelHov(true)}
              onMouseLeave={() => setCancelHov(false)}
              style={{
                padding: '11px 20px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: `1px solid ${cancelHov ? T.borderStrong : T.border}`,
                color: cancelHov ? T.textSecondary : T.textMuted,
                cursor: 'pointer', transition: 'all 0.15s linear',
                borderRadius: 0,
              }}
            >
              Cancel
            </button>

            {/* Tip */}
            <p style={{ marginLeft: 'auto', fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
              * Required fields
            </p>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
