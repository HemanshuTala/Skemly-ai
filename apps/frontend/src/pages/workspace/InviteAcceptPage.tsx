import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { workspaceAPI } from '@/services/api.service'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Button } from '@/components/ui/button'

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Validating invitation...')
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invitation token is missing.')
        return
      }
      try {
        const { data } = await workspaceAPI.acceptInvite(token)
        setCurrentWorkspace(data.data)
        await fetchWorkspaces()
        setStatus('success')
        setMessage(`You now have access to "${data.data.name}".`)
        toast.success('Workspace invitation accepted')
      } catch (error: any) {
        const apiMsg = error?.response?.data?.error?.message || error?.response?.data?.message
        setStatus('error')
        setMessage(apiMsg || 'This invitation is invalid or expired.')
      }
    }
    void run()
  }, [token, fetchWorkspaces, setCurrentWorkspace])

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        {status === 'loading' && (
          <div className="flex items-center gap-3 text-white/90">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Invitation accepted</h1>
            </div>
            <p className="text-sm text-white/70">{message}</p>
            <Button variant="glow" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-white">
              <MailWarning className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Invite cannot be used</h1>
            </div>
            <p className="text-sm text-white/70">{message}</p>
            <Button variant="outline" onClick={() => navigate('/workspace')}>
              Open Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
