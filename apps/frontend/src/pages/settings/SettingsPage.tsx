import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'
import { billingAPI } from '@/services/api.service'
import { PlanCard } from '@/components/billing/PlanCard'
import { openRazorpayCheckout } from '@/components/billing/RazorpayInlineCheckout'
import { User, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const { user, updateProfile, fetchUser } = useAuthStore()
  const [name, setName]   = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [plans, setPlans]                     = useState<any[]>([])
  const [subscription, setSubscription]       = useState<any>(null)
  const [isLoadingBilling, setIsLoadingBilling] = useState(true)
  const [isBillingBusy, setIsBillingBusy]     = useState(false)

  useEffect(() => {
    setName(user?.name || '')
    setAvatar(user?.avatar || '')
  }, [user?.name, user?.avatar])

  const loadBillingData = async () => {
    setIsLoadingBilling(true)
    try {
      const [plansRes, subRes] = await Promise.all([
        billingAPI.getPlans(),
        billingAPI.getSubscription(),
      ])
      setPlans(plansRes.data?.data || [])
      setSubscription(subRes.data?.data || null)
    } catch (err: any) {
      toast.error(`Failed to load billing: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsLoadingBilling(false)
    }
  }

  useEffect(() => { loadBillingData() }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBillingData()
        fetchUser()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUser])

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      await updateProfile({ name, avatar: avatar || undefined })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your account and subscription.</p>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-3.5 h-3.5 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d10] shadow-[0_20px_80px_rgba(0,0,0,0.18)]">

            {/* Profile header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/[0.05]">
              <div className="w-14 h-14 rounded-xl bg-white/[0.07] border border-white/[0.10] flex items-center justify-center overflow-hidden text-[18px] font-bold text-white">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">{name || 'Your Name'}</h3>
                <p className="text-[13px] text-[#52525b]">{user?.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  user?.plan === 'free'
                    ? 'bg-white/[0.05] text-[#52525b] border border-white/[0.07]'
                    : 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
                }`}>
                  {user?.plan?.toUpperCase() || 'FREE'} plan
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#52525b] uppercase tracking-[0.08em]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all font-[inherit]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#52525b] uppercase tracking-[0.08em]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] text-[13px] text-[#52525b] cursor-not-allowed font-[inherit]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#52525b] uppercase tracking-[0.08em]">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all font-[inherit]"
                />
              </div>

              {/* Save */}
              <div className="flex items-center justify-end pt-4 border-t border-white/[0.05]">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#09090b] text-[12px] font-bold hover:bg-[#e4e4e7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-[#09090b]/30 border-t-[#09090b] animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Billing Tab ── */}
        <TabsContent value="billing" className="space-y-5">

          {/* Current subscription */}
          {subscription?.plan && subscription.plan !== 'free' && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#52525b] uppercase tracking-[0.08em] mb-1">
                    Current Plan
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-white capitalize">{subscription.plan}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Active
                    </span>
                  </div>
                  {subscription.planExpiresAt && (
                    <p className="text-[12px] text-[#52525b] mt-1">
                      Renews: {new Date(subscription.planExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  disabled={isBillingBusy}
                  onClick={async () => {
                    setIsBillingBusy(true)
                    try {
                      await billingAPI.cancel()
                      toast.success('Subscription cancelled')
                      loadBillingData()
                    } catch (e: any) {
                      toast.error(e?.response?.data?.error?.message || 'Cancel failed')
                    } finally {
                      setIsBillingBusy(false)
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#f87171]/20 bg-[#f87171]/10 text-[#f87171] text-[11px] font-semibold hover:bg-[#f87171]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          )}

          {/* Plans grid */}
          <div>
            <p className="text-[13px] font-semibold text-white mb-3">
              {subscription?.plan && subscription.plan !== 'free' ? 'Change Plan' : 'Choose a Plan'}
            </p>
            {isLoadingBilling ? (
              <div className="grid md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-[#0d0d10] p-5 space-y-4 h-64">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/3 rounded" />
                      <Skeleton className="h-8 w-1/2 rounded" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-4/5 rounded" />
                      <Skeleton className="h-3 w-3/4 rounded" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={subscription?.plan === plan.id}
                    isBusy={isBillingBusy}
                    onSubscribe={async (planId) => {
                      if (planId === 'free') {
                        if (subscription?.plan && subscription.plan !== 'free') {
                          toast('Please cancel your current subscription first.')
                        }
                        return
                      }
                      await openRazorpayCheckout({
                        planId,
                        fetchUser,
                        onSuccess: () => loadBillingData(),
                        onError: (err: string) => console.error('Payment error:', err),
                      })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
