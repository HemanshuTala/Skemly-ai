import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
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
  LayoutTemplate,
  ChevronRight,
  Building2,
  UserCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { CommandPalette } from '@/components/CommandPalette'
import skemlyLogo from '@/assets/Skemly.png'

/* ─── Nav config ──────────────────────────────────────── */
const NAV_MAIN = [
  { name: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { name: 'Projects',   href: '/projects',   icon: FolderOpen },
  { name: 'Templates',  href: '/templates',  icon: LayoutTemplate },
]
const NAV_WORKSPACE = [
  { name: 'Members',    href: '/workspace',          icon: Users },
  { name: 'Settings',   href: '/settings',           icon: Settings },
]

const SIDEBAR_W = 232

/* ─── Nav item ────────────────────────────────────────── */
function NavItem({
  item,
  active,
  onClick,
}: {
  item: { name: string; href: string; icon: React.ElementType; badge?: string }
  active: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group select-none',
        active
          ? 'bg-violet-400/[0.09] text-white ring-1 ring-inset ring-violet-300/[0.10]'
          : 'text-[#71717a] hover:text-[#d4d4d8] hover:bg-white/[0.04]'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-violet-400" />
      )}
      <Icon
        size={15}
        strokeWidth={active ? 2 : 1.5}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-violet-200' : 'text-[#52525b] group-hover:text-[#a1a1aa]'
        )}
      />
      <span className="flex-1 tracking-[-0.01em]">{item.name}</span>
      {item.badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[#71717a] font-mono leading-none">
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const wsDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wsDropdownOpen && !userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [wsDropdownOpen, userMenuOpen])

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <aside
      style={{ width: SIDEBAR_W }}
      className={cn(
        'fixed top-0 left-0 z-50 h-screen flex flex-col',
        'bg-[#0a0a0d] border-r border-white/[0.05]',
        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Logo + close */}
      <div className="flex items-center gap-2.5 h-[60px] px-4 border-b border-white/[0.06] shrink-0">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <img
            src={skemlyLogo}
            alt="Schemely AI"
            className="w-6 h-6 object-contain shrink-0"
          />
          <span className="text-[14px] font-semibold text-white tracking-[-0.02em] truncate">
            Schemely
          </span>
        </Link>

        {/* Plan badge */}
        <span className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0',
          user?.plan === 'free'
            ? 'bg-white/[0.06] text-[#71717a] border border-white/[0.08]'
            : 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
        )}>
          {user?.plan?.toUpperCase() || 'FREE'}
        </span>

        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close sidebar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-2.5 border-b border-white/[0.05] shrink-0" ref={wsDropdownRef}>
        <button
          onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
          aria-expanded={wsDropdownOpen}
          aria-haspopup="listbox"
        >
          <div className="w-6 h-6 rounded-md bg-white/[0.07] flex items-center justify-center shrink-0">
            <Building2 size={11} className="text-[#a1a1aa]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#52525b] uppercase tracking-[0.08em] font-medium leading-none mb-0.5">
              Workspace
            </p>
            <p className="text-[12px] font-medium text-white truncate leading-none">
              {currentWorkspace?.name || 'Select workspace'}
            </p>
          </div>
          <ChevronDown
            size={12}
            className={cn('text-[#52525b] transition-transform duration-200', wsDropdownOpen && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {wsDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-3 right-3 top-auto mt-1 bg-[#0e0e11] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/50 z-50"
              role="listbox"
            >
              <div className="p-1.5 space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                {workspaces.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-[#52525b]">No workspaces found</div>
                ) : (
                  workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      role="option"
                      aria-selected={currentWorkspace?.id === ws.id}
                      onClick={() => {
                        onWorkspaceChange(ws)
                        setWsDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg text-[12px] transition-colors',
                        currentWorkspace?.id === ws.id
                          ? 'bg-white/[0.06] text-white'
                          : 'text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white'
                      )}
                    >
                      <div className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Building2 size={10} />
                      </div>
                      <span className="truncate flex-1 font-medium">{ws.name}</span>
                      {currentWorkspace?.id === ws.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Diagram CTA */}
      <div className="px-3 pt-3 shrink-0">
        <Link
          to="/diagram/new"
          onClick={onClose}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-[12px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 group"
        >
          <Plus size={13} strokeWidth={2.5} />
          New Diagram
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar min-h-0" aria-label="Main navigation">
        <div className="space-y-1 mb-6">
          <p className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] px-3 mb-2">
            Workspace
          </p>
          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] px-3 mb-2">
            Account
          </p>
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

      {/* User section */}
      <div className="px-3 pb-3 border-t border-white/[0.05] pt-3 shrink-0" ref={userMenuRef}>
        {/* Upgrade CTA for free users */}
        {user?.plan === 'free' && (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left group"
          >
            <Zap size={13} className="text-[#fbbf24] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white leading-none">Upgrade to Pro</p>
              <p className="text-[10px] text-[#52525b] leading-none mt-0.5">Unlock AI features</p>
            </div>
            <ChevronRight size={12} className="text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
          </button>
        )}

        {/* User card */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
            aria-expanded={userMenuOpen}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-400/10 text-[11px] font-bold text-violet-100">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-[#52525b] truncate leading-tight">
                {user?.email}
              </div>
            </div>
            <ChevronDown size={12} className={cn('text-[#52525b] transition-transform duration-200 shrink-0', userMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full left-0 right-0 mb-1 bg-[#0e0e11] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/50 z-50"
              >
                <div className="p-1.5">
                  <Link
                    to="/settings"
                    onClick={() => { setUserMenuOpen(false); onClose() }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <UserCircle size={14} />
                    Profile & Settings
                  </Link>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  onSearchClick,
  pathname,
}: {
  onMenuOpen: () => void
  user: any
  onUpgrade: () => void
  onSearchClick: () => void
  pathname: string
}) {
  // Derive page title from pathname
  const pageLabel: Record<string, string> = {
    '/dashboard':          'Dashboard',
    '/projects':           'Projects',
    '/templates':          'Templates',
    '/workspace':          'Members',
    '/workspace/settings': 'Workspace Settings',
    '/settings':           'Settings',
  }
  const title = pageLabel[pathname] ?? 'Schemely AI'

  return (
    <header className="sticky top-0 z-30 flex items-center h-[56px] sm:h-[60px] bg-[#0b0b0f]/85 backdrop-blur-xl border-b border-white/[0.06] px-3 sm:px-5 gap-2.5 sm:gap-3 shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={17} />
      </button>

      <span className="min-w-0 max-w-[7rem] truncate text-[13px] font-semibold text-white tracking-[-0.01em] lg:max-w-none">
        {title}
      </span>

      <div className="hidden lg:block w-px h-4 bg-white/[0.08] mx-0.5" />

      {/* Search */}
      <button
        onClick={onSearchClick}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-zinc-500 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-zinc-300 lg:flex-none lg:px-3 lg:max-w-[240px]"
        aria-label="Search (Ctrl+K)"
      >
        <Search size={13} />
        <span className="text-[12px] flex-1 text-left">Search…</span>
        <kbd className="hidden sm:block text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {user?.plan === 'free' && (
          <button
            onClick={onUpgrade}
            className="hidden min-h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-violet-500 sm:flex"
          >
            <Zap size={11} strokeWidth={2.5} />
            Upgrade
          </button>
        )}
        <Link
          to="/diagram/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-[11px] font-semibold hover:bg-white/[0.08] transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} />
          <span className="hidden sm:inline">New</span>
        </Link>
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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    fetchWorkspaces()
    fetchUser()
  }, [fetchWorkspaces, fetchUser])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUser()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUser])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUpgrade = () => navigate('/settings')
  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (href: string) => location.pathname === href

  return (
    <div className="h-screen bg-[#09090b] overflow-hidden">
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
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

      {/* Content */}
      <div className="lg:pl-[232px] h-full min-w-0 flex flex-col">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          user={user}
          onUpgrade={handleUpgrade}
          onSearchClick={() => setCommandOpen(true)}
          pathname={location.pathname}
        />

        <div data-lenis-prevent className="relative flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#09090b]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}