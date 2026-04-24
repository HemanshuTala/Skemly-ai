import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { billingAPI } from '@/services/api.service'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Search,
  Zap,
  Bell,
  Layers,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { CommandPalette } from '@/components/CommandPalette'
import skemlyLogo from '@/assets/Skemly.png'

/* ─── Nav config ──────────────────────────────────────── */
const NAV_MAIN = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects',  href: '/projects',  icon: FolderOpen },

]
const NAV_WORKSPACE = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

const SIDEBAR_W = 248

/* ─── Zinc tokens (mirrors Tailwind zinc scale) ───────── */
const Z = {
  950: '#09090b', 900: '#18181b', 800: '#27272a',
  700: '#3f3f46', 600: '#52525b', 500: '#71717a',
  400: '#a1a1aa', 300: '#d4d4d8', 200: '#e4e4e7',
  100: '#f4f4f5',
} as const

/* ─── Shared small icon-button ────────────────────────── */
function IconBtn({
  children,
  badge,
  onClick,
}: {
  children: React.ReactNode
  badge?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-[#3f3f46] bg-transparent text-[#a1a1aa] hover:text-white hover:bg-[#27272a] hover:border-[#52525b] transition-colors"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f87171] border-2 border-[#18181b]" />
      )}
    </button>
  )
}

/* ─── Nav item ────────────────────────────────────────── */
function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_MAIN)[0] & { badge?: string }
  active: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
        active
          ? 'bg-[#27272a] text-white border border-[#3f3f46]'
          : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-r" />
      )}
      <Icon size={16} strokeWidth={1.5} className={cn(active ? 'text-white' : 'text-[#71717a] group-hover:text-white')} />
      <span className="flex-1 text-[13px] font-medium">{item.name}</span>
      {item.badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3f3f46] text-[#a1a1aa] font-mono">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Sidebar ─────────────────────────────────────────── */
function Sidebar({
  open,
  onClose,
  user,
  onLogout,
  onUpgrade,
  isActive,
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
}: {
  open: boolean
  onClose: () => void
  user: any
  onLogout: () => void
  onUpgrade: () => void
  isActive: (href: string) => boolean
  workspaces: any[]
  currentWorkspace: any
  onWorkspaceChange: (ws: any) => void
}) {
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false)
  const wsDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!wsDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [wsDropdownOpen])

  return (
    <aside
      style={{ width: SIDEBAR_W }}
      className={cn(
        'fixed top-0 left-0 z-10 h-screen flex flex-col overflow-hidden',
        'bg-[#18181b] border-r border-[#27272a]',
        'transition-transform duration-300 ease-in-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-[52px] px-4 border-b border-[#27272a]">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onClose}
        >
          <img
            src={skemlyLogo}
            alt="Skemly"
            className="w-7 h-7 object-contain flex-shrink-0"
          />
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Skemly
          </span>
        </Link>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded bg-[#27272a] text-white border border-[#3f3f46] tracking-wide uppercase">
          {user?.plan === 'free' ? 'FREE' : user?.plan || 'FREE'}
        </span>
        <button
          onClick={onClose}
          className="lg:hidden ml-1 p-1.5 rounded-md text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-2 border-b border-[#27272a]">
        <div className="relative" ref={wsDropdownRef}>
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] transition-colors text-left"
          >
            <div className="w-6 h-6 rounded bg-[#3f3f46] flex items-center justify-center flex-shrink-0">
              <FolderOpen size={12} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#71717a] uppercase tracking-wider">Workspace</p>
              <p className="text-[13px] font-medium text-white truncate">
                {currentWorkspace?.name || 'Select workspace...'}
              </p>
            </div>
            <ChevronDown size={14} className={cn('text-[#71717a] transition-transform', wsDropdownOpen && 'rotate-180')} />
          </button>

          {wsDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#27272a] border border-[#3f3f46] rounded-lg overflow-hidden shadow-xl z-50">
              {workspaces.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-[#71717a]">No workspaces found</div>
              ) : (
                workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      onWorkspaceChange(ws)
                      setWsDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#3f3f46] transition-colors',
                      currentWorkspace?.id === ws.id ? 'bg-[#3f3f46]' : ''
                    )}
                  >
                    <div className="w-5 h-5 rounded bg-[#52525b] flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={10} className="text-white" />
                    </div>
                    <span className="text-[13px] text-white truncate flex-1">{ws.name}</span>
                    {currentWorkspace?.id === ws.id && (
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-hidden">
        <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-[0.1em] px-3 mb-2">
          General
        </p>
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-[0.1em] px-3 mb-2 mt-6">
          Workspace
        </p>
        <div className="space-y-0.5">
          {NAV_WORKSPACE.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      {/* New Diagram CTA */}
      <div className="px-3 pb-3 border-t border-[#27272a] pt-3">
        <Link
          to="/diagram/new"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white text-[#18181b] text-[13px] font-semibold hover:bg-[#e4e4e7] transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          New Diagram
        </Link>
      </div>

      {/* User */}
      <div className="px-3 pb-3 border-t border-[#27272a] pt-3">
        <div className="relative group">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#27272a] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[13px] font-medium text-white truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-[#71717a] truncate">
                {user?.email}
              </div>
            </div>
            <ChevronDown size={14} className="text-[#52525b]" />
          </button>

          {/* Dropdown — appears on hover */}
          <div className="hidden group-hover:block absolute bottom-full left-0 w-full mb-2 bg-[#27272a] border border-[#3f3f46] rounded-lg overflow-hidden shadow-xl shadow-black/50">
           
            <div className="h-px bg-[#3f3f46]" />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#f87171] hover:bg-[#3f3f46] transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ─── Top bar ─────────────────────────────────────────── */
function Topbar({
  onMenuOpen,
  user,
  onUpgrade,
}: {
  onMenuOpen: () => void
  user: any
  onUpgrade: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-[52px] bg-[#18181b] border-b border-[#27272a] px-5 gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-1.5 rounded-md text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
      >
        <Menu size={17} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-[320px]">
        <Search
          size={14}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]"
        />
        <input
          type="text"
          placeholder="Search diagrams..."
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg py-2 pl-9 pr-10 text-[13px] text-white placeholder:text-[#71717a] outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-[inherit]"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#71717a] bg-[#3f3f46] px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {user?.plan === 'free' && (
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#e4e4e7] text-[#18181b] text-[12px] font-semibold transition-colors"
          >
            <Zap size={13} strokeWidth={2} />
            Upgrade
          </button>
        )}
        <div className="w-px h-5 bg-[#27272a]" />
     
        
      </div>
    </header>
  )
}

/* ─── Main layout ─────────────────────────────────────── */
export default function DashboardLayout() {
  const location     = useLocation()
  const navigate     = useNavigate()
  const reduceMotion = useReducedMotion()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const { user, logout, fetchUser } = useAuthStore()
  const { fetchWorkspaces, workspaces, currentWorkspace } = useWorkspaceStore()

  // Fetch workspaces and user on mount
  useEffect(() => {
    fetchWorkspaces()
    fetchUser()
  }, [fetchWorkspaces, fetchUser])

  // Refresh user data when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUser()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUser])

  /* ── Upgrade via Razorpay ── */
  const handleUpgrade = async () => {
    // Navigate to settings billing page to choose a plan
    navigate('/settings')
  }

  const handleLogout = () => { logout(); navigate('/login') }

  function isActive(href: string) {
    return location.pathname === href
  }

  return (
    <div className="h-screen bg-[#09090b]">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        onUpgrade={handleUpgrade}
        isActive={isActive}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={(ws) => useWorkspaceStore.getState().setCurrentWorkspace(ws)}
      />

      {/* Content area */}
      <div className="lg:pl-[248px]">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          user={user}
          onUpgrade={handleUpgrade}
        />

        <div style={{ height: 'calc(100vh - 52px)', overflow: 'scroll', background: '#09090b' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}