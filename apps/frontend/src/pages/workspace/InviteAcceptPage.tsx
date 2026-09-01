import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, MailWarning, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { workspaceAPI } from '@/services/api.service'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { motion } from 'framer-motion'

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Validating your workspace invitation…')
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('The workspace invitation token is missing.')
        return
      }
      try {
        const { data } = await workspaceAPI.acceptInvite(token)
        setCurrentWorkspace(data.data)
        await fetchWorkspaces()
        setStatus('success')
        setMessage(`Success! You have joined "${data.data.name}".`)
        toast.success('Workspace invitation accepted')
      } catch (error: any) {
        const apiMsg = error?.response?.data?.error?.message || error?.response?.data?.message
        setStatus('error')
        setMessage(apiMsg || 'This invitation link is invalid or has expired.')
      }
    }
    void run()
  }, [token, fetchWorkspaces, setCurrentWorkspace])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-8 shadow-2xl shadow-black/80 text-center space-y-6"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <p className="text-[13px] text-[#a1a1aa] font-medium leading-relaxed">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center text-[#4ade80]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-[18px] font-bold text-white tracking-tight">Invitation Accepted</h1>
            </div>
            <p className="text-[13px] text-[#52525b] leading-relaxed px-2">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white text-[#09090b] text-[13px] font-bold hover:bg-[#e4e4e7] transition-colors shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center text-[#f87171]">
                <MailWarning className="h-6 w-6" />
              </div>
              <h1 className="text-[18px] font-bold text-white tracking-tight">Invitation Error</h1>
            </div>
            <p className="text-[13px] text-[#52525b] leading-relaxed px-2">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-[13px] font-semibold hover:bg-white/[0.08] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
