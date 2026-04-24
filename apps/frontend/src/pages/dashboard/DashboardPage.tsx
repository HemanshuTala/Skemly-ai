import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'
import { billingAPI } from '@/services/api.service'
import { useRazorpay } from '@/hooks/useRazorpay'
import {
  Plus,
  FileText,
  Clock,
  Star,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
  GitBranch,
  Zap,
  Layout,
  Boxes,
  Globe,
  MoreHorizontal,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import CountUp from 'react-countup'
import toast from 'react-hot-toast'
import { ThreeBackground } from '@/components/ui/ThreeBackground'
import { cn } from '@/lib/utils'

const DIAGRAM_TYPE_ICON: Record<string, typeof FileText> = {
  flowchart: GitBranch,
  sequence: Activity,
  mindmap: Boxes,
  erd: Layout,
  network: Globe,
}

const TYPE_GRADIENTS: Record<string, string> = {
  flowchart: 'from-white/20 to-white/5',
  sequence: 'from-zinc-400/20 to-zinc-400/5',
  mindmap: 'from-zinc-300/20 to-zinc-300/5',
  erd: 'from-zinc-500/20 to-zinc-500/5',
  network: 'from-white/15 to-zinc-500/10',
}

const TYPE_ICON_COLOR: Record<string, string> = {
  flowchart: 'text-white',
  sequence: 'text-zinc-200',
  mindmap: 'text-zinc-300',
  erd: 'text-zinc-400',
  network: 'text-white/80',
}

function DiagramCard({ diagram, index }: { diagram: any; index: number }) {
  const Icon = DIAGRAM_TYPE_ICON[diagram.type] || FileText
  const gradient = TYPE_GRADIENTS[diagram.type] || 'from-primary/15 to-primary/5'
  const iconColor = TYPE_ICON_COLOR[diagram.type] || 'text-primary'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/diagram/${diagram.id}`}>
        <div className="group relative overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#3f3f46] hover:shadow-lg hover:shadow-black/40 cursor-pointer">
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

          {/* Top row */}
          <div className="flex items-start justify-between mb-6">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center border border-[#3f3f46] shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex items-center gap-2">
              {diagram.starred && (
                <div className="w-8 h-8 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-white text-white" />
                </div>
              )}
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg bg-[#27272a] border border-[#3f3f46] hover:bg-[#3f3f46] transition-all"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MoreHorizontal className="w-4 h-4 text-[#a1a1aa]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-6">
            <h3 className="font-display text-base font-bold text-white group-hover:text-white transition-colors line-clamp-1">
                {diagram.title}
            </h3>
            <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#27272a] border border-[#3f3f46]", iconColor)}>
                    {diagram.type || 'Diagram'}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#52525b]" />
                <span className="text-[10px] font-medium text-[#71717a]">Logic Mode</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            <div className="flex items-center gap-2 text-[11px] text-[#71717a] font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(diagram.updatedAt), { addSuffix: true })}</span>
            </div>
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#27272a] border border-[#3f3f46] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { diagrams, fetchDiagrams, isLoading } = useDiagramStore()
  const { isLoaded, openCheckout } = useRazorpay()
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({
    totalDiagrams: 0,
    recentActivity: 0,
    collaborators: 0,
  })

  useEffect(() => {
    if (currentWorkspace) {
      fetchDiagrams({ workspaceId: currentWorkspace.id })
    }
  }, [currentWorkspace, fetchDiagrams])

  useEffect(() => {
    if (diagrams.length > 0) {
      const activeDiagrams = diagrams.filter(d => !d.trashed)
      const recentDiagrams = activeDiagrams.filter(d => {
        const daysSinceUpdate = (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceUpdate <= 7
      })
      setStats({
        totalDiagrams: activeDiagrams.length,
        recentActivity: recentDiagrams.length,
        collaborators: currentWorkspace?.members?.length || 0,
      })
    }
  }, [diagrams, currentWorkspace])

  useLayoutEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-greeting', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo('.hero-sub', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 })
      gsap.fromTo('.quick-action', { opacity: 0, y: 20, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', delay: 0.2,
      })
    }, heroRef.current)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!statsRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.stat-card', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.3,
      })
    }, statsRef.current)
    return () => ctx.revert()
  }, [])

  const recentDiagrams = diagrams
    .filter(d => !d.trashed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const starredDiagrams = diagrams.filter(d => d.starred && !d.trashed).slice(0, 3)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const QUICK_ACTIONS = [
    {
      to: '/diagram/new',
      icon: Plus,
      label: 'New Diagram',
      sub: 'Start from scratch',
      gradient: 'from-zinc-700 to-zinc-800',
      glow: 'shadow-black/25',
      onClick: undefined,
    },

    {
      to: '/diagram/new?ai=1',
      icon: Sparkles,
      label: 'AI Generate',
      sub: 'Describe & create',
      gradient: 'from-zinc-600 to-zinc-800',
      glow: 'shadow-black/25',
      onClick: undefined,
    },
    {
      to: '/projects',
      icon: FileText,
      label: 'Browse Projects',
      sub: 'View all diagrams',
      gradient: 'from-zinc-700 to-zinc-800',
      glow: 'shadow-black/25',
      onClick: undefined,
    },
  ]

  return (
    <div className="relative font-sans bg-[#09090b]">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10 space-y-10">
        {/* ── HERO ──────────────────────────────── */}
        <div ref={heroRef} className="relative">
          {/* Ambient glow blob */}
          <div className="absolute -top-16 -left-8 w-[500px] h-[300px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex justify-left">
  <div className="relative z-10 pt-8 pb-10 w-full max-w-3xl text-left">
    
    <h1 className="hero-greeting text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 font-display">
      {getGreeting()},{' '}
      <span className="text-white">
        {user?.name?.split(' ')[0] || 'Architect'}
      </span>
    </h1>

    <p className="hero-sub text-base md:text-lg text-[#a1a1aa] font-medium leading-relaxed mb-8 px-4 text-balance">
      {stats.totalDiagrams > 0 
        ? `You have ${stats.totalDiagrams} diagram${stats.totalDiagrams !== 1 ? 's' : ''}. What are you building today?`
        : 'Start creating beautiful diagrams with AI assistance.'}
    </p>

  </div>
</div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  onClick={action.onClick}
                  className="quick-action block"
                >
                  <div className="group relative overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] p-5 h-full transition-all duration-300 hover:-translate-y-1 hover:border-[#3f3f46] hover:shadow-lg hover:shadow-black/40 cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#52525b] transition-all duration-300">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-white mb-1">{action.label}</h3>
                    <p className="text-xs text-[#71717a]">{action.sub}</p>

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-[#a1a1aa]" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── STATS ─────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Diagrams',
              value: stats.totalDiagrams,
              icon: BarChart3,
              trend: '+12%',
            },
            {
              label: 'Active This Week',
              value: stats.recentActivity,
              icon: Zap,
              trend: '+8%',
            },
            {
              label: 'AI Generated',
              value: Math.floor(stats.totalDiagrams * 0.3),
              icon: Sparkles,
              trend: '+25%',
            },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="stat-card relative overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-[#4ade80] uppercase tracking-wider">{s.trend}</span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  <CountUp end={s.value} duration={1.2} delay={i * 0.15} />
                </div>
                <p className="text-xs text-[#71717a] font-medium">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Starred */}
        {starredDiagrams.length > 0 && (
          <section className="w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 fill-white text-white" />
                <h2 className="text-base font-bold tracking-tight text-white">Starred</h2>
              </div>
              <button type="button" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717a] hover:text-white transition-colors">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {starredDiagrams.map((d, i) => (
                <DiagramCard key={d.id} diagram={d} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#71717a]" />
              <h2 className="text-base font-bold tracking-tight text-white">Recent Diagrams</h2>
            </div>
            <button type="button" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717a] hover:text-white transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        {isLoading && diagrams.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-[#3f3f46] animate-ping absolute" />
                <Loader2 className="w-6 h-6 animate-spin text-[#a1a1aa] relative" />
              </div>
              <p className="text-sm text-[#71717a]">Loading your diagrams…</p>
            </div>
          </div>
        ) : recentDiagrams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#3f3f46] bg-[#18181b] p-8 md:p-12 text-center w-full">
            <div className="relative mx-auto w-12 h-12 mb-4">
              <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-full h-full">
                <GitBranch className="w-6 h-6 text-[#71717a]" />
              </div>
            </div>
            <h3 className="text-base font-bold mb-2 text-white">Start your first diagram</h3>
            <p className="text-sm text-[#a1a1aa] mb-5 mx-auto leading-relaxed whitespace-nowrap">
              Create beautiful flowcharts, mind maps, and more with AI assistance
            </p>
            <Link to="/diagram/new">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#18181b] text-sm font-bold hover:bg-[#e4e4e7] transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Diagram
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDiagrams.map((d, i) => (
              <DiagramCard key={d.id} diagram={d} index={i} />
            ))}
          </div>
        )}
      </section>

        {/* Upgrade Banner */}
        {user?.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-xl border border-[#3f3f46] bg-[#18181b] w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
            <div className="relative p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#18181b]">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pro</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mb-2">Unlock the full potential</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Unlimited diagrams, advanced AI, precision exports, and real-time collaboration.
                </p>
              </div>
              <div className="flex-shrink-0 lg:pl-4">
                <Button
                  type="button"
                  variant="glow"
                  rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  className="px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-xl transition-all whitespace-nowrap"
              onClick={async () => {
                if (!isLoaded) {
                  toast.error('Payment system loading...')
                  return
                }
                toast.loading('Connecting to payment...', { id: 'billing' })
                try {
                  const res = await billingAPI.subscribe({ planId: 'pro' })
                  const { subscriptionId, shortUrl } = res.data?.data || {}
                  
                  if (!subscriptionId) {
                    toast.error('Failed to create subscription', { id: 'billing' })
                    return
                  }

                  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SFzdvgFWIJjzUx'
                  
                  const checkout = openCheckout({
                    key: RAZORPAY_KEY_ID,
                    subscription_id: subscriptionId,
                    name: 'Skemly',
                    description: 'Subscribe to Pro Plan',
                    handler: async (response: any) => {
                      try {
                        await billingAPI.verifyPayment({
                          razorpayPaymentId: response.razorpay_payment_id,
                          razorpaySubscriptionId: response.razorpay_subscription_id,
                          razorpaySignature: response.razorpay_signature,
                        })
                        // Refresh user data to update plan status
                        await fetchUser()
                        toast.success('Payment successful! Welcome to Pro.', { id: 'billing' })
                        navigate('/payment/success')
                      } catch {
                        toast.error('Payment verification failed', { id: 'billing' })
                      }
                    },
                    theme: { color: '#c99367' },
                    modal: {
                      ondismiss: () => {
                        toast('Payment cancelled', { id: 'billing' })
                      },
                    },
                  })

                  if (!checkout && shortUrl) {
                    window.location.href = shortUrl
                  }
                } catch (e: any) {
                  const msg = e?.response?.data?.error?.message || 'Upgrade failed'
                  toast.error(msg, { id: 'billing' })
                }
              }}
            >
              Upgrade to Pro
            </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
