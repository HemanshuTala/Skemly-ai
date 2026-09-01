import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

import { diagramAPI, notesAPI } from '@/services/api.service'
import { cn } from '@/lib/utils'

type SmokeStep = {
  key: string
  title: string
  ok: boolean | null
  detail?: string
  data?: unknown
}

export default function DebugPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore()

  const apiBaseUrl = '/api/v1'
  const healthUrl = useMemo(() => {
    // Strip /api/v1 to get the root for /health
    return apiBaseUrl.replace(/\/api\/v1\/?$/, '') + '/health'
  }, [apiBaseUrl])

  const [steps, setSteps] = useState<SmokeStep[]>([
    { key: 'health', title: 'API Health (/health)', ok: null },
    { key: 'oauth', title: 'OAuth Provider Config', ok: null },
    { key: 'list', title: 'List Diagrams', ok: null },
    { key: 'get', title: 'Get Diagram by ID', ok: null },
    { key: 'notes', title: 'Get Notes for Diagram', ok: null },
  ])

  const [latestDiagramId, setLatestDiagramId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (isAuthenticated && (!workspaces || workspaces.length === 0)) {
      void fetchWorkspaces()
    }
  }, [isAuthenticated, workspaces, fetchWorkspaces])

  const setStep = (key: string, patch: Partial<SmokeStep>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  const runHealth = async () => {
    try {
      setStep('health', { ok: null, detail: undefined, data: undefined })
      const res = await fetch(healthUrl, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      const ok = res.ok
      setStep('health', {
        ok,
        detail: ok ? 'Connected' : `HTTP ${res.status}`,
        data: json,
      })
      return ok
    } catch (e: any) {
      setStep('health', { ok: false, detail: e?.message || 'Health check failed' })
      return false
    }
  }

  const runDiagramFlow = async () => {
    if (!currentWorkspace) {
      toast.error('Select a workspace first (left sidebar)')
      return
    }
    if (!isAuthenticated) {
      toast.error('Login required to test diagram endpoints')
      return
    }

    // 1) List
    setStep('list', { ok: null, detail: undefined, data: undefined })
    const listRes = await diagramAPI.list({ workspaceId: currentWorkspace.id, limit: 10 })
    setLatestDiagramId(null)
    const diagrams = (listRes?.data as any) || []
    setStep('list', {
      ok: true,
      detail: `Found ${diagrams.length} diagram(s)`,
      data: diagrams.slice(0, 3),
    })

    if (!diagrams[0]?.id) {
      toast('No diagrams found yet in this workspace')
      return
    }

    // 2) Get
    const id = diagrams[0].id as string
    setLatestDiagramId(id)
    setStep('get', { ok: null, detail: undefined, data: undefined })
    const getRes = await diagramAPI.get(id)
    setStep('get', { ok: true, detail: `Loaded diagram: ${getRes?.data?.title || id}`, data: getRes?.data })

    // 3) Notes
    setStep('notes', { ok: null, detail: undefined, data: undefined })
    const notesRes = await notesAPI.get(id)
    setStep('notes', {
      ok: true,
      detail: notesRes?.contentText ? `Notes found (${String(notesRes.contentText).length} chars)` : 'Notes loaded',
      data: notesRes,
    })
  }

  const runOAuthStatus = async () => {
    setStep('oauth', { ok: null, detail: undefined, data: undefined })
    const apiBase = '/api/v1'
    const statusRes = await fetch(`${apiBase}/auth/providers/status`)
    const json = await statusRes.json().catch(() => ({}))
    const configured =
      Boolean(json?.data?.google?.configured) || Boolean(json?.data?.github?.configured)

    setStep('oauth', {
      ok: configured ? true : false,
      detail: configured
        ? 'Google/GitHub configured'
        : 'Google/GitHub not configured (check env)',
      data: json,
    })

    return configured
  }

  const runAll = async () => {
    setIsRunning(true)
    try {
      const ok = await runHealth()
      if (!ok) return
      await runOAuthStatus()
      await runDiagramFlow()
    } catch (e: any) {
      toast.error(e?.message || 'Smoke test failed')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Diagram Smoke Test</h1>
            <p className="text-[#a1a1aa] text-sm leading-relaxed max-w-xl">
              Confirms backend connectivity and diagram endpoints (list, get, and notes).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border",
              isAuthenticated 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            )}>
              {isAuthenticated ? 'Authenticated' : 'Not logged in'}
            </span>
          </div>
        </div>

        <div className="bg-[#0d0d10] border border-white/[0.06] rounded-xl p-6 mb-8">
          <h2 className="text-[#71717a] text-xs font-bold uppercase tracking-wider mb-4">Controls</h2>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button 
              onClick={runHealth} 
              disabled={isRunning} 
              className="bg-[#27272a] text-white hover:bg-[#3f3f46] rounded-xl h-10 font-bold"
            >
              Check API Health
            </Button>
            <Button
              onClick={() => {
                void (async () => {
                  const ok = await runHealth()
                  if (ok) await runDiagramFlow()
                })()
              }}
              disabled={isRunning}
              className="bg-white text-[#18181b] hover:bg-[#e4e4e7] rounded-xl h-10 font-bold"
            >
              Test Diagram Endpoints
            </Button>
            <Button 
              onClick={runAll} 
              disabled={isRunning} 
              className="bg-transparent border border-white/[0.08] text-white hover:bg-white/[0.02] rounded-xl h-10 font-bold"
            >
              Run All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#a1a1aa] bg-[#09090b] border border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-[#71717a]">Health URL:</span> 
              <span className="font-mono text-white text-xs">{healthUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#71717a]">Workspace:</span> 
              <span className="font-medium text-white">{currentWorkspace?.name || 'None'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#71717a]">User:</span> 
              <span className="font-medium text-white">{user?.email || 'N/A'}</span>
            </div>
            {latestDiagramId && (
              <div className="flex items-center gap-2">
                <span className="text-[#71717a]">Latest ID:</span> 
                <span className="font-mono text-white text-xs">{latestDiagramId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[#71717a] text-xs font-bold uppercase tracking-wider mb-4">Results</h2>
          {steps.map((s) => (
            <div key={s.key} className="bg-[#0d0d10] border border-white/[0.06] rounded-xl p-5 transition-all hover:border-white/[0.12]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="font-bold text-white">{s.title}</div>
                <div className="flex items-center gap-2">
                  {s.ok === null && <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />}
                  {s.ok === true && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />}
                  {s.ok === false && <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />}
                  <span className="text-xs font-medium text-[#71717a]">
                    {s.ok === null ? 'Pending' : s.ok ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>
              {s.detail && <div className="text-sm text-[#a1a1aa] mb-3">{s.detail}</div>}
              {s.data !== undefined && (
                <div className="bg-[#09090b] border border-white/[0.05] rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-[#a1a1aa] whitespace-pre-wrap">
                    {JSON.stringify(s.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

