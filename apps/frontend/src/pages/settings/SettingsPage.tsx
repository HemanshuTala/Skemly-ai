import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { billingAPI } from '@/services/api.service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanCard } from '@/components/billing/PlanCard'
import { openRazorpayCheckout } from '@/components/billing/RazorpayInlineCheckout'
import { 
  User, 
  CreditCard,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
  const { user, updateProfile, fetchUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingBilling, setIsLoadingBilling] = useState(true)
  const [isBillingBusy, setIsBillingBusy] = useState(false)

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
      console.error('[Billing] Failed to load:', err)
      toast.error(`Failed to load billing: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsLoadingBilling(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  // Refresh billing and user data when window becomes visible (e.g., returning from payment)
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

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 pt-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181b] border border-[#27272a] p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#27272a]">
            <User className="w-8 h-8 text-[#a1a1aa]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="text-[#a1a1aa] text-sm mt-0.5">
              Manage your account and billing
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="inline-flex h-10 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
          <TabsTrigger value="profile" className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[#a1a1aa] data-[state=active]:bg-[#27272a] data-[state=active]:text-white transition-all">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[#a1a1aa] data-[state=active]:bg-[#27272a] data-[state=active]:text-white transition-all">
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key="profile" value="profile" className="mt-0 focus-visible:outline-none">
            <motion.div
              key="profile-motion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#27272a] flex items-center justify-center overflow-hidden border border-[#3f3f46]">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-[#a1a1aa]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{name || 'User'}</h3>
                    <p className="text-sm text-[#71717a]">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#71717a]">Display Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 text-sm text-white focus:border-[#52525b] focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#71717a]">Avatar URL</label>
                    <input
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full h-9 rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 text-sm text-white focus:border-[#52525b] focus:outline-none transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end pt-4 border-t border-[#27272a]">
                  <Button
                    isLoading={isSavingProfile}
                    className="bg-white text-[#18181b] hover:bg-[#e4e4e7] border-0 text-sm h-9 px-4"
                    onClick={async () => {
                      setIsSavingProfile(true)
                      try {
                        await updateProfile({ name, avatar: avatar || undefined })
                        toast.success('Profile updated')
                      } finally {
                        setIsSavingProfile(false)
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent key="billing" value="billing" className="mt-0 focus-visible:outline-none">
            <motion.div
              key="billing-motion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Subscription Status */}
              {subscription?.plan && subscription.plan !== 'free' && (
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#71717a] uppercase tracking-wide">Current Plan</p>
                      <p className="text-lg font-semibold text-white capitalize">{subscription.plan}</p>
                      {subscription.planExpiresAt && (
                        <p className="text-xs text-[#a1a1aa]">
                          Renews: {new Date(subscription.planExpiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium">
                        Active
                      </span>
                      <Button
                        variant="secondary"
                        className="text-red-400 hover:bg-red-500/10 text-xs h-7 px-2"
                        isLoading={isBillingBusy}
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
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-white">
                  {subscription?.plan && subscription.plan !== 'free' ? 'Change Plan' : 'Subscription Plans'}
                </h3>
              </div>

              {isLoadingBilling ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
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
                            toast('Please cancel your current subscription to switch to the free plan.')
                          }
                          return;
                        }

                        await openRazorpayCheckout({
                          planId,
                          fetchUser,
                          onSuccess: () => {
                            loadBillingData()
                          },
                          onError: (error: string) => {
                            console.error('Payment error:', error)
                          }
                        })
                      }}
                    />
                  ))}
                </div>
              )}

            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

// Removed unused Workspace tab content

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
  // simple fallback or import from date-fns
  return date.toLocaleDateString()
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

