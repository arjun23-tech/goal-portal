import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import api from '../utils/api'

/* ─────────────────────────────────────────────────────────────────────────
   Poster Modernist palette — used FULLY here since it's not data-heavy
   Cream bg     #E3E2DE
   Cobalt       #1351AA
   Jet black    #141414
   Deep gray    #444343
   Muted        #7A7A7A
   Border       #C7C7C7
   ───────────────────────────────────────────────────────────────────────── */

const DEMO_USERS = [
  { label: 'Admin',               user: 'admin',    pass: 'admin123',   role: 'ADMIN'    },
  { label: 'Manager',             user: 'manager1', pass: 'manager123', role: 'MANAGER'  },
  { label: 'Employee · Approved', user: 'john',     pass: 'emp123',     role: 'EMPLOYEE' },
  { label: 'Employee · Pending',  user: 'jane',     pass: 'emp123',     role: 'EMPLOYEE' },
  { label: 'Employee · Draft',    user: 'mike',     pass: 'emp123',     role: 'EMPLOYEE' },
]

/* ── Wordmark ────────────────────────────────────────────────────────────── */
function Wordmark({ light }) {
  const text = light ? '#E3E2DE' : '#141414'
  const sub  = light ? 'rgba(227,226,222,0.45)' : '#7A7A7A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Square logo mark */}
      <div style={{
        width: 36, height: 36, background: light ? '#E3E2DE' : '#1351AA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
          <path d="M10 2L16 5.5V13.5L10 17L4 13.5V5.5L10 2Z"
            stroke={light ? '#1351AA' : '#E3E2DE'} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="10" cy="10" r="2.5" fill={light ? '#1351AA' : '#E3E2DE'} />
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em',
          textTransform: 'uppercase', color: text, lineHeight: 1,
        }}>
          GoalFlow
        </div>
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 700, fontSize: 9, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: sub, marginTop: 2,
        }}>
          Performance Portal
        </div>
      </div>
    </div>
  )
}

/* ── Left branding panel ─────────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div style={{
      flex: '0 0 48%', background: '#141414',
      display: 'flex', flexDirection: 'column',
      padding: '48px 56px',
      position: 'relative', overflow: 'hidden',
      minHeight: '100vh',
    }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Cobalt grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(19,81,170,1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(19,81,170,1) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Large cobalt square — decorative */}
      <div style={{
        position: 'absolute', bottom: -120, right: -80,
        width: 420, height: 420,
        border: '1px solid rgba(19,81,170,0.18)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, right: -20,
        width: 240, height: 240,
        background: 'rgba(19,81,170,0.07)',
        border: '1px solid rgba(19,81,170,0.15)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
        <Wordmark light />
      </div>

      {/* Hero headline — Poster Modernist */}
      <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', paddingBlock: 48 }}>
        {/* Eyebrow label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 32, height: 1, background: '#1351AA' }} />
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#1351AA',
          }}>
            Q3 · 2025 Cycle Active
          </span>
        </div>

        {/* Main headline — compressed, black weight */}
        <h1 style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(48px, 5.5vw, 72px)',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          color: '#E3E2DE',
          marginBottom: 32,
        }}>
          SET.<br />
          <span style={{ color: '#1351AA' }}>TRACK.</span><br />
          GROW.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 14, fontWeight: 400, lineHeight: 1.65,
          color: 'rgba(227,226,222,0.45)', maxWidth: 300,
        }}>
          Define your objectives, align with your team, and measure what matters — every quarter.
        </p>
      </div>

      {/* Bottom stats row */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 0,
        borderTop: '1px solid rgba(227,226,222,0.08)',
        paddingTop: 28,
      }}>
        {[
          { value: '100%', label: 'Goal alignment' },
          { value: 'Q4',   label: 'Current cycle' },
          { value: '4×',   label: 'Quarterly reviews' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            paddingRight: i < 2 ? 24 : 0,
            borderRight: i < 2 ? '1px solid rgba(227,226,222,0.08)' : 'none',
            paddingLeft: i > 0 ? 24 : 0,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 500, fontSize: 22,
              color: '#E3E2DE', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "'DM Sans', system-ui",
              fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(227,226,222,0.3)',
              marginTop: 6,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Login page
════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [seeding, setSeeding]     = useState(false)
  const [userFocus, setUserFocus] = useState(false)
  const [passFocus, setPassFocus] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      if (user.role === 'admin')        navigate('/admin')
      else if (user.role === 'manager') navigate('/manager')
      else                              navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u, p) => { setUsername(u); setPassword(p) }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await api.post('/seed')
      setError('')
      alert('✅ Demo data seeded! You can now log in with the demo accounts.')
    } catch {
      setError('Seeding failed')
    } finally {
      setSeeding(false)
    }
  }

  /* Shared input style */
  const inputStyle = (focused) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13, fontWeight: 500,
    background: '#F5F4F0',
    border: `1px solid ${focused ? '#1351AA' : '#C7C7C7'}`,
    color: '#141414', outline: 'none',
    transition: 'border-color 0.15s linear',
    borderRadius: 0,
  })

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #7A7A7A; }
        select option { background: #fff; color: #141414; }
      `}</style>

      {/* ── Left: branding panel (hidden on small screens) ── */}
      <div style={{ display: 'flex', flex: '0 0 48%' }} className="brand-panel">
        <BrandPanel />
      </div>

      {/* ── Right: login form — cream background ── */}
      <div style={{
        flex: 1, background: '#E3E2DE',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', minHeight: '100vh', overflowY: 'auto',
      }}>
        {/* Mobile-only wordmark */}
        <div style={{ marginBottom: 36, display: 'none' }} className="mobile-wordmark">
          <Wordmark />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}>
              <div style={{ width: 24, height: 1, background: '#1351AA' }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#1351AA',
              }}>
                Secure Sign-In
              </span>
            </div>
            <h2 style={{
              fontSize: 28, fontWeight: 900, color: '#141414',
              letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10,
            }}>
              Welcome back.
            </h2>
            <p style={{ fontSize: 13, color: '#7A7A7A', fontWeight: 400, lineHeight: 1.5 }}>
              Sign in to access your performance dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#7A7A7A',
              }}>
                Username
              </label>
              <input
                style={inputStyle(userFocus)}
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setUserFocus(true)}
                onBlur={() => setUserFocus(false)}
                autoFocus
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#7A7A7A',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle(passFocus), paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#7A7A7A', display: 'flex', alignItems: 'center',
                    padding: 0, transition: 'color 0.15s linear',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#141414'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7A7A7A'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 20,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#dc2626', fontSize: 12, fontWeight: 500,
              }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <SubmitButton loading={loading} />
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: '#C7C7C7' }} />
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#7A7A7A',
            }}>
              Demo Accounts
            </span>
            <div style={{ flex: 1, height: 1, background: '#C7C7C7' }} />
          </div>

          {/* Quick login cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#C7C7C7' }}>
            {DEMO_USERS.map((d, i) => (
              <DemoCard key={d.user} d={d} onClick={() => quickLogin(d.user, d.pass)} />
            ))}
          </div>

          {/* Seed button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              marginTop: 16, width: '100%',
              padding: '10px', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid #C7C7C7', color: '#7A7A7A',
              cursor: seeding ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s linear',
            }}
            onMouseEnter={e => {
              if (!seeding) {
                e.currentTarget.style.borderColor = '#141414'
                e.currentTarget.style.color = '#141414'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#C7C7C7'
              e.currentTarget.style.color = '#7A7A7A'
            }}
          >
            {seeding ? 'Seeding…' : '🌱 Seed Demo Data'}
          </button>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .brand-panel { display: none !important; }
          .mobile-wordmark { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Submit button ────────────────────────────────────────────────────────── */
function SubmitButton({ loading }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        background: loading ? '#444343' : hov ? '#141414' : '#1351AA',
        color: '#E3E2DE', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s linear',
      }}
    >
      {loading ? (
        <>
          <div style={{
            width: 14, height: 14, border: '2px solid rgba(227,226,222,0.3)',
            borderTopColor: '#E3E2DE', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Signing in…
        </>
      ) : (
        <>
          Sign In
          <ArrowRight size={14} />
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}

/* ── Demo account card ───────────────────────────────────────────────────── */
function DemoCard({ d, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px',
        background: hov ? '#F5F4F0' : '#E3E2DE',
        border: 'none', cursor: 'pointer',
        transition: 'background 0.15s linear',
        textAlign: 'left', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Role indicator */}
        <div style={{
          width: 5, height: 5, flexShrink: 0,
          background: d.role === 'ADMIN' ? '#f59e0b'
            : d.role === 'MANAGER' ? '#a78bfa' : '#1351AA',
        }} />
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 12, fontWeight: 600, color: '#141414',
        }}>
          {d.label}
        </span>
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#7A7A7A', letterSpacing: '0.02em',
      }}>
        {d.user} / {d.pass}
      </span>
    </button>
  )
}
