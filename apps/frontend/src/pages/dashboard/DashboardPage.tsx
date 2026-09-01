import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { billingAPI } from '@/services/api.service'
import { useRazorpay } from '@/hooks/useRazorpay'
import {
  Plus,
  FileText,
  Clock,
  Star,
  BarChart3,
  Sparkles,
  ArrowRight,
  GitBranch,
  Zap,
  Layout,
  Globe,
  MoreHorizontal,
  ChevronRight,
  Activity,
  Boxes,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

/* ── Diagram type config ── */
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  flowchart: { icon: GitBranch,  color: 'text-white',     bg: 'bg-white/[0.07]' },
  sequence:  { icon: Activity,   color: 'text-zinc-300',  bg: 'bg-zinc-300/[0.07]' },
  mindmap:   { icon: Boxes,      color: 'text-zinc-200',  bg: 'bg-zinc-200/[0.07]' },
  erd:       { icon: Layout,     color: 'text-zinc-400',  bg: 'bg-zinc-400/[0.07]' },
  network:   { icon: Globe,      color: 'text-zinc-200',  bg: 'bg-zinc-200/[0.07]' },
}
const DEFAULT_TYPE = { icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-400/[0.07]' }

/* ── Stagger container ── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

/* ── Diagram Card ── */
function DiagramCard({ diagram, index }: { diagram: any; index: number }) {
  const cfg = TYPE_CONFIG[diagram.type] || DEFAULT_TYPE
  const Icon = cfg.icon

  return (
    <motion.div variants={fadeUp}>
      <Link to={`/diagram/${diagram.id}`} tabIndex={0}>
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/40 cursor-pointer">
          {/* Subtle hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-xl" />

          {/* Top row */}
          <div className="flex items-start justify-between mb-5">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border border-white/[0.08] transition-transform duration-300 group-hover:scale-105', cfg.bg)}>
              <Icon className={cn('w-5 h-5', cfg.color)} />
            </div>
            <div className="flex items-center gap-1.5">
              {diagram.starred && (
                <Star className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
              )}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-all"
                aria-label="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-[#71717a]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mb-4 space-y-1.5">
            <h3 className="text-[14px] font-semibold text-white line-clamp-1 tracking-[-0.01em]">
              {diagram.title}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#52525b] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                {diagram.type || 'diagram'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#52525b]">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(diagram.updatedAt), { addSuffix: true })}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#52525b] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ── Skeleton Card ── */
function DiagramCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0d0d10] p-5 space-y-5">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-7 h-7 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3.5 w-3.5 rounded" />
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { diagrams, fetchDiagrams, isLoading } = useDiagramStore()
  const { isLoaded, openCheckout } = useRazorpay()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ total: 0, thisWeek: 0, starred: 0 })

  useEffect(() => {
    if (currentWorkspace) fetchDiagrams({ workspaceId: currentWorkspace.id })
  }, [currentWorkspace, fetchDiagrams])

  useEffect(() => {
    const active  = diagrams.filter(d => !d.trashed)
    const week    = active.filter(d =>
      (Date.now() - new Date(d.updatedAt).getTime()) < 7 * 86400 * 1000
    )
    const starred = active.filter(d => d.starred)
    setStats({ total: active.length, thisWeek: week.length, starred: starred.length })
  }, [diagrams])

  const recentDiagrams  = diagrams.filter(d => !d.trashed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const starredDiagrams = diagrams.filter(d => d.starred && !d.trashed).slice(0, 3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const QUICK_ACTIONS = [
    { to: '/diagram/new',     icon: Plus,     label: 'New Diagram',      sub: 'Start from scratch' },
    { to: '/diagram/new?ai=1', icon: Sparkles, label: 'Generate with AI', sub: 'Describe & create' },
    { to: '/templates',       icon: Layout,   label: 'Browse Templates',  sub: 'Pre-built patterns' },
    { to: '/projects',        icon: Layers,   label: 'All Projects',      sub: 'Organize your work' },
  ]

  const STAT_ITEMS = [
    { label: 'Total Diagrams',   value: stats.total,   icon: BarChart3,  },
    { label: 'Active This Week', value: stats.thisWeek, icon: TrendingUp, },
    { label: 'Starred',          value: stats.starred,  icon: Star,       },
  ]

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-10">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[12px] font-medium text-[#52525b] uppercase tracking-[0.1em] mb-1">
          {greeting}
        </p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white leading-tight mb-1.5">
          {firstName}
        </h1>
        <p className="text-[14px] text-[#52525b]">
          {stats.total > 0
            ? `${stats.total} diagram${stats.total !== 1 ? 's' : ''} in this workspace`
            : 'Create your first diagram to get started'}
        </p>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <motion.div key={action.to} variants={fadeUp}>
              <Link to={action.to} tabIndex={0}>
                <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d10] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.02] cursor-pointer h-full">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-3 group-hover:bg-white/[0.10] transition-colors">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[13px] font-semibold text-white mb-0.5 tracking-[-0.01em]">{action.label}</p>
                  <p className="text-[11px] text-[#52525b]">{action.sub}</p>
                  <ArrowRight className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 text-[#52525b] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-3"
      >
        {STAT_ITEMS.map((s) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={fadeUp}>
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#a1a1aa]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[22px] font-bold text-white tracking-tight leading-none mb-0.5">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-[#52525b] truncate">{s.label}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Starred ── */}
      {starredDiagrams.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#fbbf24]" />
              <h2 className="text-[14px] font-semibold text-white tracking-[-0.01em]">Starred</h2>
            </div>
            <Link to="/projects" className="flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-white transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {starredDiagrams.map((d, i) => (
              <DiagramCard key={d.id} diagram={d} index={i} />
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Recent Diagrams ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#52525b]" />
            <h2 className="text-[14px] font-semibold text-white tracking-[-0.01em]">Recent</h2>
          </div>
          <Link to="/projects" className="flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-white transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading && diagrams.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <DiagramCardSkeleton key={i} />)}
          </div>
        ) : recentDiagrams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0d0d10] p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-5 h-5 text-[#52525b]" />
            </div>
            <h3 className="text-[14px] font-semibold text-white mb-1.5">No diagrams yet</h3>
            <p className="text-[13px] text-[#52525b] mb-5 max-w-[280px] mx-auto leading-relaxed">
              Create your first diagram or generate one using AI
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link to="/diagram/new">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#09090b] text-[12px] font-semibold hover:bg-[#e4e4e7] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Diagram
                </button>
              </Link>
              <Link to="/diagram/new?ai=1">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-[12px] font-semibold hover:bg-white/[0.08] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate with AI
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {recentDiagrams.map((d, i) => (
              <DiagramCard key={d.id} diagram={d} index={i} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Upgrade Banner ── */}
      {user?.plan === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d10] p-5"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white text-[#09090b]">
                  <Zap className="w-2.5 h-2.5" />
                  Pro
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1 tracking-[-0.01em]">
                Unlock the full power of Schemely AI
              </h3>
              <p className="text-[12px] text-[#52525b] leading-relaxed">
                Unlimited diagrams, advanced AI generation, real-time collaboration, and more.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!isLoaded) { toast.error('Payment system loading...'); return }
                toast.loading('Connecting to payment…', { id: 'billing' })
                try {
                  const res = await billingAPI.subscribe({ planId: 'pro' })
                  const { subscriptionId, shortUrl } = res.data?.data || {}
                  if (!subscriptionId) { toast.error('Failed to create subscription', { id: 'billing' }); return }
                  const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SFzdvgFWIJjzUx'
                  const checkout = openCheckout({
                    key: KEY,
                    subscription_id: subscriptionId,
                    name: 'Schemely AI',
                    description: 'Pro Plan',
                    handler: async (response: any) => {
                      try {
                        await billingAPI.verifyPayment({
                          razorpayPaymentId: response.razorpay_payment_id,
                          razorpaySubscriptionId: response.razorpay_subscription_id,
                          razorpaySignature: response.razorpay_signature,
                        })
                        await fetchUser()
                        toast.success('Payment successful! Welcome to Pro.', { id: 'billing' })
                        navigate('/payment/success')
                      } catch { toast.error('Payment verification failed', { id: 'billing' }) }
                    },
                    modal: { ondismiss: () => toast.dismiss('billing') },
                  })
                  if (!checkout && shortUrl) window.location.href = shortUrl
                } catch (e: any) {
                  toast.error(e?.response?.data?.error?.message || 'Upgrade failed', { id: 'billing' })
                }
              }}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#09090b] text-[12px] font-bold hover:bg-[#e4e4e7] transition-colors"
            >
              Upgrade to Pro
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
