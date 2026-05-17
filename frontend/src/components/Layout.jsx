import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Settings, LogOut,
  Zap, Bell, Search, Menu, X, ChevronRight,
  Target, CheckCircle2, Clock, AlertTriangle,
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
}

/* ════════════════════════════════════════════════════════════════════════
   FIX 3 — Global Search Context
   Provides `searchQuery` (debounced string) to any child dashboard page.
   Usage in a page: const { searchQuery } = useSearch()
════════════════════════════════════════════════════════════════════════ */
export const SearchContext = createContext({ searchQuery: '' })
export const useSearch = () => useContext(SearchContext)

/* ── Role config ──────────────────────────────────────────────────────── */
const ROLE = {
  employee: { label: 'Employee',      dot: '#38bdf8', avatarFrom: '#0284c7', avatarTo: '#1351AA' },
  manager:  { label: 'Manager',       dot: '#a78bfa', avatarFrom: '#7c3aed', avatarTo: '#4f46e5' },
  admin:    { label: 'Administrator', dot: '#fbbf24', avatarFrom: '#d97706', avatarTo: '#b45309' },
}

const NAV = {
  employee: [{ to: '/dashboard', icon: LayoutDashboard, label: 'My Goals' }],
  manager:  [{ to: '/manager',   icon: Users,           label: 'Team Goals' }],
  admin: [
    { to: '/admin',   icon: Settings, label: 'Admin Panel'  },
    { to: '/manager', icon: Users,    label: 'Goals Review' },
  ],
}

/* ── FIX 4 — Notification data ────────────────────────────────────────── */
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: 'submitted',
    icon: Target,
    iconColor: '#fbbf24',
    iconBg: 'rgba(251,191,36,0.10)',
    title: 'Goal Submitted',
    body: 'Your Q3 goals are awaiting manager review.',
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    type: 'approved',
    icon: CheckCircle2,
    iconColor: '#34d399',
    iconBg: 'rgba(52,211,153,0.10)',
    title: 'Goal Approved',
    body: '"Improve Customer NPS" was approved by your manager.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 3,
    type: 'update_pending',
    icon: Clock,
    iconColor: '#1351AA',
    iconBg: 'rgba(19,81,170,0.10)',
    title: 'Quarterly Update Pending',
    body: 'Q3 update is due in 5 days. Log your progress now.',
    time: '3h ago',
    unread: true,
  },
  {
    id: 4,
    type: 'rejected',
    icon: AlertTriangle,
    iconColor: '#f87171',
    iconBg: 'rgba(248,113,113,0.08)',
    title: 'Goal Needs Revision',
    body: '"Reduce Bug Count" was returned with feedback.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 5,
    type: 'approved',
    icon: CheckCircle2,
    iconColor: '#34d399',
    iconBg: 'rgba(52,211,153,0.10)',
    title: 'Goal Approved',
    body: '"Complete AWS Certification" has been approved.',
    time: '2d ago',
    unread: false,
  },
]

/* ── Page meta from pathname ──────────────────────────────────────────── */
function usePageMeta() {
  const { pathname } = useLocation()
  const map = {
    '/dashboard': { title: 'My Goals',    sub: 'Personal objectives'  },
    '/goals/new': { title: 'New Goal',    sub: 'Define an objective'  },
    '/manager':   { title: 'Team Goals',  sub: 'Review team progress' },
    '/admin':     { title: 'Admin Panel', sub: 'System management'    },
  }
  if (pathname.includes('/edit'))   return { title: 'Edit Goal',        sub: 'Update objective'   }
  if (pathname.includes('/update')) return { title: 'Quarterly Update', sub: 'Log your progress'  }
  return map[pathname] ?? { title: 'GoalFlow', sub: '' }
}

/* ── Avatar ───────────────────────────────────────────────────────────── */
function Avatar({ name, role, size = 'md' }) {
  const r = ROLE[role] ?? ROLE.employee
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'
  const dim = size === 'sm' ? 28 : 34
  return (
    <div
      style={{
        width: dim, height: dim, flexShrink: 0,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 900, letterSpacing: '-0.01em',
        background: `linear-gradient(135deg, ${r.avatarFrom}, ${r.avatarTo})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}

/* ── Sidebar nav link ─────────────────────────────────────────────────── */
function SideNavLink({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', cursor: 'pointer', userSelect: 'none',
            background: isActive ? T.cobaltTint : 'transparent',
            borderLeft: `2px solid ${isActive ? T.cobalt : 'transparent'}`,
            color: isActive ? T.textPrimary : T.textSecondary,
            transition: 'all 0.15s linear',
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = T.surfaceHover
              e.currentTarget.style.color = T.textPrimary
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = T.textSecondary
            }
          }}
        >
          <Icon
            size={15} style={{
              flexShrink: 0,
              color: isActive ? T.cobalt : 'inherit',
              transition: 'color 0.15s linear',
            }}
          />
          {!collapsed && (
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, truncate: true }}>
              {label}
            </span>
          )}
          {!collapsed && isActive && (
            <ChevronRight size={11} style={{ color: T.cobalt, opacity: 0.7 }} />
          )}
          {collapsed && (
            <div style={{
              position: 'absolute', left: '100%', marginLeft: 10,
              padding: '6px 10px', whiteSpace: 'nowrap',
              background: T.surface, border: `1px solid ${T.borderStrong}`,
              color: T.textPrimary, fontSize: 11, fontWeight: 600,
              opacity: 0, pointerEvents: 'none',
              transition: 'opacity 0.1s linear', zIndex: 99,
            }}
              className="nav-tooltip"
            >
              {label}
            </div>
          )}
        </div>
      )}
    </NavLink>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   FIX 4 — Notification dropdown
════════════════════════════════════════════════════════════════════════ */
function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => n.unread).length
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const markAllRead = () =>
    setNotifications(ns => ns.map(n => ({ ...n, unread: false })))

  const markRead = (id) =>
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n))

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 340, zIndex: 100,
        background: T.surface, border: `1px solid ${T.borderStrong}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 2, height: 13, background: T.cobalt }} />
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.textMuted,
          }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
              color: T.cobalt, background: T.cobaltTint,
              border: `1px solid ${T.cobaltBorder}`,
              padding: '0 5px',
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: T.cobalt,
              padding: '2px 4px', transition: 'color 0.15s linear',
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.cobaltHover}
            onMouseLeave={e => e.currentTarget.style.color = T.cobalt}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.map((n, i) => {
          const Icon = n.icon
          return (
            <div key={n.id}>
              <div
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', gap: 12, padding: '13px 16px', cursor: 'pointer',
                  background: n.unread ? 'rgba(19,81,170,0.04)' : 'transparent',
                  borderLeft: `2px solid ${n.unread ? T.cobalt : 'transparent'}`,
                  transition: 'background 0.1s linear',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(19,81,170,0.04)' : 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: n.iconBg, border: `1px solid ${n.iconColor}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: n.iconColor }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 12, fontWeight: n.unread ? 700 : 500,
                      color: n.unread ? T.textPrimary : T.textSecondary,
                      lineHeight: 1.2,
                    }}>
                      {n.title}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      color: T.textMuted, flexShrink: 0, marginTop: 1,
                    }}>
                      {n.time}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 11, color: T.textMuted, lineHeight: 1.45,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {n.body}
                  </p>
                </div>

                {/* Unread dot */}
                {n.unread && (
                  <div style={{
                    width: 6, height: 6, flexShrink: 0,
                    background: T.cobalt, marginTop: 4,
                  }} />
                )}
              </div>
              {i < notifications.length - 1 && (
                <div style={{ height: 1, background: T.border }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: `1px solid ${T.border}`,
        textAlign: 'center',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: T.textMuted,
            transition: 'color 0.15s linear',
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
        >
          Dismiss all
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   FIX 3 — Search modal/overlay
════════════════════════════════════════════════════════════════════════ */
function SearchOverlay({ query, setQuery, onClose }) {
  const ref     = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handler)
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 80,
    }}>
      <div
        ref={ref}
        style={{
          width: '100%', maxWidth: 520,
          background: T.surface, border: `1px solid ${T.borderStrong}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        }}>
          <Search size={15} style={{ color: T.textMuted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search goals, employees, status…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 14, fontWeight: 500, color: T.textPrimary,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
          <kbd style={{
            padding: '2px 6px', fontSize: 9, fontWeight: 700,
            background: T.surfaceHover, border: `1px solid ${T.borderStrong}`,
            color: T.textMuted, letterSpacing: '0.05em',
          }}>
            ESC
          </kbd>
        </div>

        {/* Hint */}
        <div style={{ padding: '10px 16px' }}>
          {query ? (
            <p style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
              Filtering dashboard content for <strong style={{ color: T.textSecondary }}>"{query}"</strong>
              {' '}— results update live below.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { hint: 'Search by goal title', ex: '"Improve customer NPS"' },
                { hint: 'Search by employee name', ex: '"John Smith"' },
                { hint: 'Search by status keyword', ex: '"approved"  ·  "draft"' },
              ].map(row => (
                <div key={row.hint} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: T.textMuted, minWidth: 140,
                  }}>
                    {row.hint}
                  </span>
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: 'monospace' }}>
                    {row.ex}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Layout
════════════════════════════════════════════════════════════════════════ */
export default function Layout() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const { title, sub }    = usePageMeta()
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)

  // FIX 3 — search state
  const [rawSearch, setRawSearch]     = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen]   = useState(false)
  const debounceRef = useRef(null)

  // FIX 4 — notification state
  const [notifOpen, setNotifOpen] = useState(false)
  const bellRef = useRef(null)
  const unreadCount = SAMPLE_NOTIFICATIONS.filter(n => n.unread).length
  const [localUnread, setLocalUnread] = useState(unreadCount)

  const handleLogout = () => { logout(); navigate('/login') }

  // Debounce raw → committed search query (250 ms)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(rawSearch), 250)
    return () => clearTimeout(debounceRef.current)
  }, [rawSearch])

  // Close search overlay resets query
  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setRawSearch('')
    setSearchQuery('')
  }, [])

  // ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const items = NAV[user?.role] ?? []
  const role  = ROLE[user?.role] ?? ROLE.employee
  const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} · ${new Date().getFullYear()}`

  /* ── Shared sidebar body ──────────────────────────────────────────── */
  const SidebarBody = ({ mobile = false }) => {
    const isExpanded = mobile || !collapsed
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.pageBg }}>

        {/* Logo row */}
        <div style={{
          display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          justifyContent: !isExpanded ? 'center' : 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, background: T.cobalt, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={13} color="white" strokeWidth={2.5} />
          </div>
          {isExpanded && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 900, textTransform: 'uppercase', fontSize: 12,
                color: T.textPrimary, letterSpacing: '-0.01em', lineHeight: 1,
              }}>
                GoalFlow
              </div>
              <div style={{
                marginTop: 2, fontWeight: 700, textTransform: 'uppercase',
                fontSize: 8, letterSpacing: '0.16em', color: T.textMuted,
              }}>
                Performance Portal
              </div>
            </div>
          )}
          {isExpanded && !mobile && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                marginLeft: 'auto', padding: 4, background: 'none', border: 'none',
                cursor: 'pointer', color: T.textMuted, display: 'flex',
                transition: 'color 0.15s linear',
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >
              <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
        </div>

        {/* User block */}
        <div style={{ padding: 12, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {isExpanded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.surfaceHover }}>
              <Avatar name={user?.full_name} role={user?.role} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name ?? 'User'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <div style={{ width: 5, height: 5, background: role.dot }} />
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted }}>
                    {role.label}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar name={user?.full_name} role={user?.role} size="sm" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {isExpanded && (
            <div style={{
              padding: '0 16px 8px', fontSize: 8, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: T.textMuted,
            }}>
              Navigation
            </div>
          )}
          {items.map(item => (
            <SideNavLink key={item.to} {...item} collapsed={!isExpanded} />
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: 8, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
              color: T.textMuted, transition: 'all 0.15s linear',
              justifyContent: !isExpanded ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {isExpanded && <span style={{ fontSize: 13, fontWeight: 500 }}>Sign Out</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <SearchContext.Provider value={{ searchQuery }}>
      <div style={{
        display: 'flex', minHeight: '100vh',
        background: T.pageBg, fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        `}</style>

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden lg:flex flex-col shrink-0"
          style={{
            width: collapsed ? 56 : 216,
            borderRight: `1px solid ${T.border}`,
            transition: 'width 0.2s linear',
            background: T.pageBg,
          }}
        >
          <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
            <SidebarBody />
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="fixed left-14 top-4 w-5 h-5 flex items-center justify-center z-50"
              style={{
                background: T.surface, border: `1px solid ${T.borderStrong}`, color: T.textMuted,
                transition: 'all 0.15s linear', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.cobalt; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textMuted }}
            >
              <ChevronRight size={11} />
            </button>
          )}
        </aside>

        {/* ── Mobile sidebar ── */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <aside style={{ position: 'relative', width: 216, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
              <SidebarBody mobile />
            </aside>
            <button
              style={{ position: 'absolute', top: 12, left: 228, padding: 6, background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer', zIndex: 10 }}
              onClick={() => setMobileOpen(false)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Main shell ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top header ── */}
          <header
            style={{
              height: 56, display: 'flex', alignItems: 'center', gap: 16,
              padding: '0 20px', flexShrink: 0, position: 'relative', zIndex: 20,
              borderBottom: `1px solid ${T.border}`,
              background: T.pageBg, backdropFilter: 'blur(12px)',
            }}
          >
            {/* Mobile toggle */}
            <button
              className="lg:hidden"
              style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={16} />
            </button>

            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
              <h1 style={{
                fontSize: 15, fontWeight: 900, color: T.textPrimary,
                letterSpacing: '-0.02em', lineHeight: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {title}
              </h1>
              {sub && (
                <>
                  <span style={{ color: T.border, fontSize: 12 }}>·</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: T.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                    className="hidden sm:block"
                  >
                    {sub}
                  </span>
                </>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Quarter badge */}
            <div
              className="hidden sm:flex"
              style={{
                alignItems: 'center', padding: '4px 10px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: T.cobalt, background: T.cobaltTint,
                border: `1px solid rgba(19,81,170,0.2)`,
              }}
            >
              {quarter}
            </div>

            {/* FIX 3 — Search button → opens overlay */}
            <button
              className="hidden md:flex"
              onClick={() => setSearchOpen(true)}
              style={{
                alignItems: 'center', gap: 8, padding: '6px 12px',
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.textMuted, cursor: 'pointer',
                fontSize: 11, fontWeight: 500, transition: 'all 0.15s linear',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted }}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd style={{
                marginLeft: 4, padding: '2px 5px', fontSize: 9, fontWeight: 700,
                background: T.surfaceHover, border: `1px solid ${T.borderStrong}`, color: T.textMuted,
              }}>
                ⌘K
              </kbd>
            </button>

            {/* FIX 4 — Bell with dropdown */}
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{
                  position: 'relative', padding: 8, background: 'none', border: 'none',
                  cursor: 'pointer', color: notifOpen ? T.textSecondary : T.textMuted,
                  transition: 'color 0.15s linear', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
                onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.color = T.textMuted }}
              >
                <Bell size={15} />
                {localUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 7, height: 7, background: T.cobalt,
                    border: `1.5px solid ${T.pageBg}`,
                  }} />
                )}
              </button>

              {notifOpen && (
                <NotificationDropdown onClose={() => { setNotifOpen(false); setLocalUnread(0) }} />
              )}
            </div>

            {/* Avatar */}
            <Avatar name={user?.full_name} role={user?.role} size="sm" />
          </header>

          {/* ── Page content ── */}
          <main style={{ flex: 1, overflowY: 'auto', background: T.pageBg }}>
            <div style={{ padding: '28px 20px' }} className="lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* FIX 3 — Search overlay (rendered at root level, above everything) */}
        {searchOpen && (
          <SearchOverlay
            query={rawSearch}
            setQuery={setRawSearch}
            onClose={closeSearch}
          />
        )}
      </div>
    </SearchContext.Provider>
  )
}
