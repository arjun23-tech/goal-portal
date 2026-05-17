import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import {
  ChevronLeft, Save, AlertCircle, Target, Hash,
  Scale, Sparkles, ChevronDown, ChevronUp, Check,
  RefreshCw, Building2, X,
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
  violetBorder:  'rgba(167,139,250,0.22)',
}

const UOM_OPTIONS = [
  '%', 'Number', 'Score', 'Rating (1-5)',
  'Hours', 'Days', 'Sessions', 'Projects',
  'Certifications', 'Bugs', '$ Revenue', 'NPS Score', 'Custom',
]

const DEPARTMENTS = [
  'Sales', 'Engineering', 'HR', 'Operations',
  'Customer Support', 'Marketing', 'Finance', 'Product',
]

/* ════════════════════════════════════════════════════════════════════════
   AI SUGGESTIONS — Claude API call
   Calls claude-sonnet-4-20250514, returns 4 structured KPI suggestions
   as JSON so we can parse and render them as selectable cards.
════════════════════════════════════════════════════════════════════════ */
async function fetchAISuggestions(department, existingTitle) {
  const prompt = `You are an expert in enterprise performance management and OKR frameworks.

Generate exactly 4 realistic, measurable KPI goals for a ${department} department employee for an annual performance cycle.

${existingTitle ? `The employee is already thinking about: "${existingTitle}". Complement this with related but distinct goals.` : ''}

Respond ONLY with a valid JSON array. No markdown, no explanation, no backticks. Just the raw JSON array.

Each object must have exactly these keys:
- "title": string (concise goal title, max 60 chars)
- "description": string (1-2 sentences explaining the goal and how success is measured)
- "target": string (numeric target value only, e.g. "95" not "95%")
- "uom": string (must be one of: %, Number, Score, Rating (1-5), Hours, Days, Sessions, Projects, Certifications, Bugs, $ Revenue, NPS Score)
- "weightage": number (integer between 10 and 40, realistic weight for this goal type)

Make goals specific, ambitious but achievable, and aligned with typical ${department} KPIs. Use varied UoMs across the 4 goals.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`API error ${response.status}`)
  const data = await response.json()
  const text = data.content?.find(b => b.type === 'text')?.text ?? ''

  // Strip any accidental markdown fences before parsing
  const clean = text.replace(/```json|```/gi, '').trim()
  return JSON.parse(clean)
}

/* ── Shared form primitives ───────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: T.textMuted,
      }}>
        {children}
      </span>
      {required && <span style={{ fontSize: 9, color: T.cobalt, fontWeight: 700 }}>*</span>}
    </div>
  )
}

function FieldWrap({ children, hint }) {
  return (
    <div>
      {children}
      {hint && <p style={{ marginTop: 6, fontSize: 10, color: T.textMuted, fontWeight: 500 }}>{hint}</p>}
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
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.cobalt }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: T.textMuted }}>{index}</span>
    </div>
  )
}

function Input({ value, onChange, placeholder, required, type = 'text', autoFocus, onBlur }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} required={required} autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={e => { setFocused(false); onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 13, fontWeight: 500,
        background: T.surfaceHover,
        border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
        color: T.textPrimary, outline: 'none',
        transition: 'border-color 0.15s linear', borderRadius: 0,
      }}
    />
  )
}

function Textarea({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px', height: 96, resize: 'none',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 13, fontWeight: 500, lineHeight: 1.55,
        background: T.surfaceHover,
        border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
        color: T.textPrimary, outline: 'none',
        transition: 'border-color 0.15s linear', borderRadius: 0,
      }}
    />
  )
}

function Select({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 36px 11px 14px', appearance: 'none',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13, fontWeight: 500,
          background: T.surfaceHover,
          border: `1px solid ${focused ? T.cobaltBorder : T.border}`,
          color: T.textPrimary, outline: 'none', cursor: 'pointer',
          transition: 'border-color 0.15s linear', borderRadius: 0,
        }}
      >
        {children}
      </select>
      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4L6 8L10 4" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    </div>
  )
}

function WeightIndicator({ currentTotal }) {
  const ok    = Math.abs(currentTotal - 100) < 0.01
  const over  = currentTotal > 100
  const color  = ok ? T.emerald : over ? T.rose : T.amber
  const tint   = ok ? T.emeraldTint : over ? T.roseTint : T.amberTint
  const border = ok ? T.emeraldBorder : over ? T.roseBorder : T.amberBorder
  const label  = ok ? 'Ready' : over ? 'Over budget' : 'In progress'

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ position: 'relative', height: 4, background: T.border, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${Math.min(currentTotal, 100)}%`,
          background: color, transition: 'width 0.3s linear, background 0.15s linear',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '2px 8px', color, background: tint, border: `1px solid ${border}`,
          }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Min per goal: 10%</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color, letterSpacing: '-0.01em' }}>
          {currentTotal.toFixed(0)}<span style={{ color: T.textMuted, fontSize: 11 }}>/100%</span>
        </span>
      </div>
    </div>
  )
}

function WeightSlider({ value, onChange, min, max }) {
  return (
    <div>
      <style>{`
        .gf-slider { -webkit-appearance:none; appearance:none; width:100%; height:3px; background:transparent; outline:none; cursor:pointer; }
        .gf-slider::-webkit-slider-runnable-track { height:3px; background:${T.border}; }
        .gf-slider::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:0; background:${T.cobalt}; border:2px solid ${T.cobalt}; margin-top:-5.5px; cursor:pointer; transition:background 0.15s linear; }
        .gf-slider::-webkit-slider-thumb:hover { background:${T.cobaltHover}; }
        .gf-slider::-moz-range-thumb { width:14px; height:14px; border-radius:0; background:${T.cobalt}; border:2px solid ${T.cobalt}; cursor:pointer; }
      `}</style>
      <input
        type="range" className="gf-slider"
        min={min} max={Math.max(min, max)} step={5}
        value={value} onChange={onChange}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   AI SUGGESTION CARD
════════════════════════════════════════════════════════════════════════ */
function SuggestionCard({ suggestion, onApply, applied }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', padding: '16px 18px', cursor: 'pointer',
        background: applied ? T.cobaltTint : hov ? T.surfaceHover : T.surface,
        border: `1px solid ${applied ? T.cobaltBorder : hov ? T.borderStrong : T.border}`,
        borderLeft: `3px solid ${applied ? T.cobalt : hov ? T.violet : T.border}`,
        transition: 'all 0.15s linear',
      }}
      onClick={onApply}
    >
      {/* Applied badge */}
      {applied && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: T.cobalt, background: T.cobaltTint,
          border: `1px solid ${T.cobaltBorder}`,
        }}>
          <Check size={9} /> Applied
        </div>
      )}

      {/* Title */}
      <div style={{
        fontSize: 13, fontWeight: 700, color: T.textPrimary,
        letterSpacing: '-0.01em', marginBottom: 6,
        paddingRight: applied ? 80 : 0,
      }}>
        {suggestion.title}
      </div>

      {/* Description */}
      <p style={{
        fontSize: 11, color: T.textSecondary, lineHeight: 1.5,
        marginBottom: 12,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {suggestion.description}
      </p>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: 1, background: T.border, flexWrap: 'wrap' }}>
        {[
          { label: 'Target', value: suggestion.target },
          { label: 'UoM',    value: suggestion.uom },
          { label: 'Weight', value: `${suggestion.weightage}%` },
        ].map(chip => (
          <div key={chip.label} style={{ padding: '6px 12px', background: T.surfaceHover }}>
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: T.textMuted, marginBottom: 2,
            }}>
              {chip.label}
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              color: T.cobalt, letterSpacing: '-0.01em',
            }}>
              {chip.value}
            </div>
          </div>
        ))}
        <div style={{
          marginLeft: 'auto', padding: '6px 14px', background: T.surfaceHover,
          display: 'flex', alignItems: 'center', gap: 6,
          color: applied ? T.cobalt : hov ? T.textSecondary : T.textMuted,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          transition: 'color 0.15s linear',
        }}>
          {applied ? <Check size={10} /> : <ChevronDown size={10} />}
          {applied ? 'Applied' : 'Use this'}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   AI SUGGESTIONS PANEL
════════════════════════════════════════════════════════════════════════ */
function AISuggestionsPanel({ onApply, currentTitle }) {
  const [open, setOpen]               = useState(false)
  const [department, setDepartment]   = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [appliedIdx, setAppliedIdx]   = useState(null)
  const [deptFocused, setDeptFocused] = useState(false)
  const [genHov, setGenHov]           = useState(false)

  const handleGenerate = async () => {
    if (!department) { setError('Please select a department first.'); return }
    setError('')
    setLoading(true)
    setSuggestions([])
    setAppliedIdx(null)
    try {
      const results = await fetchAISuggestions(department, currentTitle)
      if (!Array.isArray(results) || results.length === 0) throw new Error('No suggestions returned')
      setSuggestions(results)
    } catch (e) {
      setError('Could not generate suggestions. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (idx) => {
    const s = suggestions[idx]
    onApply({
      title:       s.title,
      description: s.description,
      target:      String(s.target),
      uom:         s.uom,
      weightage:   Number(s.weightage) || 20,
    })
    setAppliedIdx(idx)
  }

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Toggle button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', cursor: 'pointer',
          background: open ? T.violetTint : T.surface,
          border: `1px solid ${open ? T.violetBorder : T.border}`,
          borderBottom: open ? 'none' : `1px solid ${open ? T.violetBorder : T.border}`,
          transition: 'all 0.15s linear',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: open ? T.violetTint : T.cobaltTint,
            border: `1px solid ${open ? T.violetBorder : T.cobaltBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles size={13} style={{ color: open ? T.violet : T.cobalt }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: T.textPrimary,
              letterSpacing: '-0.01em',
            }}>
              ✨ Generate AI Goal Suggestions
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, marginTop: 2 }}>
              Get smart KPI suggestions tailored to your department
            </div>
          </div>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
        }
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{
          background: T.surface,
          border: `1px solid ${T.violetBorder}`,
          borderTop: 'none',
        }}>

          {/* Department selector row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 12,
            padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                marginBottom: 6, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase', color: T.textMuted,
              }}>
                Department / Function
              </div>
              <div style={{ position: 'relative' }}>
                <Building2 size={12} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: T.textMuted, pointerEvents: 'none',
                }} />
                <select
                  value={department}
                  onChange={e => { setDepartment(e.target.value); setError('') }}
                  onFocus={() => setDeptFocused(true)}
                  onBlur={() => setDeptFocused(false)}
                  style={{
                    width: '100%', padding: '10px 36px 10px 32px', appearance: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 13, fontWeight: 500,
                    background: T.surfaceHover,
                    border: `1px solid ${deptFocused ? T.violetBorder : T.border}`,
                    color: department ? T.textPrimary : T.textMuted,
                    outline: 'none', cursor: 'pointer',
                    transition: 'border-color 0.15s linear', borderRadius: 0,
                  }}
                >
                  <option value="" disabled>Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <svg style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }} width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4L6 8L10 4" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !department}
              onMouseEnter={() => setGenHov(true)}
              onMouseLeave={() => setGenHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', flexShrink: 0,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
                background: loading || !department
                  ? T.surfaceHover
                  : genHov ? T.cobaltHover : T.cobalt,
                color: loading || !department ? T.textMuted : '#f0f1f3',
                border: loading || !department ? `1px solid ${T.border}` : 'none',
                cursor: loading || !department ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s linear', borderRadius: 0,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 12, height: 12,
                    border: `2px solid ${T.textMuted}`,
                    borderTopColor: T.textSecondary,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  {suggestions.length ? 'Regenerate' : 'Generate'}
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderBottom: `1px solid ${T.roseBorder}`,
              background: T.roseTint, color: T.rose, fontSize: 12, fontWeight: 500,
            }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border, padding: '1px 0 0' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: 110, background: T.surface,
                  animation: 'pulse 1.4s ease infinite',
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
          )}

          {/* Suggestion cards */}
          {!loading && suggestions.length > 0 && (
            <>
              {/* Header bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', borderBottom: `1px solid ${T.border}`,
                background: T.pageBg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 2, height: 13, background: T.violet }} />
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: T.textMuted,
                  }}>
                    {suggestions.length} suggestions for {department}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
                  Click a card to auto-fill the form
                </span>
              </div>

              {/* Cards grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 1, background: T.border, padding: 1,
              }}>
                {suggestions.map((s, i) => (
                  <SuggestionCard
                    key={i}
                    suggestion={s}
                    applied={appliedIdx === i}
                    onApply={() => handleApply(i)}
                  />
                ))}
              </div>

              {/* Footer hint */}
              <div style={{
                padding: '10px 20px',
                borderTop: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
                  Suggestions are AI-generated. Review and adjust values before submitting.
                </span>
                {appliedIdx !== null && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: T.cobalt, background: T.cobaltTint,
                      border: `1px solid ${T.cobaltBorder}`,
                      cursor: 'pointer', transition: 'all 0.15s linear',
                    }}
                  >
                    <Check size={9} /> Done — Close panel
                  </button>
                )}
              </div>
            </>
          )}

          {/* Empty / idle state */}
          {!loading && suggestions.length === 0 && !error && (
            <div style={{
              padding: '28px 20px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 40, height: 40,
                background: T.violetTint, border: `1px solid ${T.violetBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
              }}>
                <Sparkles size={18} style={{ color: T.violet }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>
                Select a department and click Generate
              </p>
              <p style={{ fontSize: 11, color: T.textMuted }}>
                Claude AI will suggest 4 tailored KPI goals for your team.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   GoalForm — main component (all existing logic unchanged)
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
  const [appliedFlash, setAppliedFlash] = useState(false)

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

  /* Auto-fill from AI suggestion */
  const handleApplySuggestion = (suggestion) => {
    setForm(f => ({
      ...f,
      title:       suggestion.title,
      description: suggestion.description,
      target:      suggestion.target,
      uom:         suggestion.uom,
      weightage:   Math.min(suggestion.weightage, remaining),
    }))
    // Check if uom is in the standard list
    if (!UOM_OPTIONS.includes(suggestion.uom)) setCustomUom(true)
    else setCustomUom(false)

    // Flash the form to draw attention
    setAppliedFlash(true)
    setTimeout(() => setAppliedFlash(false), 600)
  }

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
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        ::placeholder { color: ${T.textMuted}; }
        select option  { background: #16191f; color: ${T.textPrimary}; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes flashBorder {
          0%   { box-shadow: 0 0 0 0 rgba(167,139,250,0.5); }
          50%  { box-shadow: 0 0 0 4px rgba(167,139,250,0.2); }
          100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
        }
      `}</style>

      {/* ── Back ── */}
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
        <ChevronLeft size={14} />Back
      </button>

      {/* ── Page header ── */}
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

      {/* ── AI Suggestions Panel (new — sits above the form) ── */}
      {!isEdit && (
        <AISuggestionsPanel
          onApply={handleApplySuggestion}
          currentTitle={form.title}
        />
      )}

      {/* ── Form card ── */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        animation: appliedFlash ? 'flashBorder 0.6s ease' : 'none',
        transition: 'border-color 0.15s linear',
      }}>
        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Objective Details ── */}
          <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${T.border}` }}>
            <SectionDivider icon={Target} label="Objective Details" index="01" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FieldWrap hint="Write a clear, measurable objective — e.g. 'Improve customer satisfaction score to 90%'">
                <Label required>Goal Title</Label>
                <Input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Improve Customer Satisfaction Score"
                  required
                  autoFocus={isEdit}
                />
              </FieldWrap>
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
              <FieldWrap hint="The numeric value you're aiming to reach by year-end">
                <Label required>Target Value</Label>
                <Input
                  value={form.target}
                  onChange={e => set('target', e.target.value)}
                  placeholder="e.g. 90"
                  required
                />
              </FieldWrap>
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
              <div>
                <Label required>Weight Allocation (%)</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <WeightSlider
                      value={form.weightage}
                      min={10}
                      max={remaining}
                      onChange={e => set('weightage', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <input
                      type="number" min={10} max={100} step={1}
                      value={form.weightage}
                      onChange={e => set('weightage', Number(e.target.value))}
                      style={{
                        width: 80, padding: '9px 28px 9px 12px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 16, fontWeight: 700, textAlign: 'right',
                        background: T.surfaceHover,
                        border: `1px solid ${T.border}`,
                        color: T.textPrimary, outline: 'none', borderRadius: 0,
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

                {/* Budget summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: T.border, marginBottom: 4 }}>
                  {[
                    { label: 'This goal',        value: `${form.weightage}%`,                          color: T.cobalt       },
                    { label: 'Other drafts',      value: `${totalOtherWeight}%`,                        color: T.textSecondary },
                    { label: 'Remaining budget',  value: `${Math.max(0, remaining - form.weightage)}%`, color: T.textMuted    },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '10px 14px', background: T.surfaceHover }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: item.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {item.value}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, marginTop: 5 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <WeightIndicator currentTotal={currentTotal} />
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 28px',
              background: T.roseTint,
              borderTop: `1px solid ${T.roseBorder}`,
              borderBottom: `1px solid ${T.roseBorder}`,
            }}>
              <AlertCircle size={13} style={{ color: T.rose, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: T.rose }}>{error}</span>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '20px 28px', background: T.pageBg,
            borderTop: `1px solid ${T.border}`,
          }}>
            <button
              type="submit"
              disabled={saving}
              onMouseEnter={() => setSubmitHov(true)}
              onMouseLeave={() => setSubmitHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: saving ? T.surfaceHover : submitHov ? T.cobaltHover : T.cobalt,
                color: saving ? T.textMuted : '#f0f1f3',
                border: saving ? `1px solid ${T.border}` : 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s linear', borderRadius: 0,
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
                <><Save size={13} />{isEdit ? 'Save Changes' : 'Create Goal'}</>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              onMouseEnter={() => setCancelHov(true)}
              onMouseLeave={() => setCancelHov(false)}
              style={{
                padding: '11px 20px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'transparent',
                border: `1px solid ${cancelHov ? T.borderStrong : T.border}`,
                color: cancelHov ? T.textSecondary : T.textMuted,
                cursor: 'pointer', transition: 'all 0.15s linear', borderRadius: 0,
              }}
            >
              Cancel
            </button>

            <p style={{ marginLeft: 'auto', fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
              * Required fields
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
