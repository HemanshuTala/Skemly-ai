import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

import { diagramAPI, notesAPI } from '@/services/api.service'

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

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://13.60.224.91:5000/api/v1'
  const healthUrl = useMemo(() => {
    // VITE_API_URL is usually ".../api/v1" so health is at ".../health"
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
    const apiBase = import.meta.env.VITE_API_URL || 'http://13.60.224.91:5000/api/v1'
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Diagram Smoke Test</h1>
          <p className="text-muted-foreground mt-1">
            Confirms backend connectivity and diagram endpoints (list, get, and notes).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isAuthenticated ? 'success' : 'warning'}>
            {isAuthenticated ? 'Authenticated' : 'Not logged in'}
          </Badge>
        </div>
      </div>

      <Card className="p-4 sm:p-6 bg-card/90 border-border/80 shadow-md rounded-2xl mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runHealth} disabled={isRunning} variant="secondary">
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
            variant="primary"
          >
            Test Diagram Endpoints
          </Button>
          <Button onClick={runAll} disabled={isRunning} variant="outline">
            Run All
          </Button>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Health URL: <span className="font-mono text-foreground">{healthUrl}</span>
          <div className="mt-1">
            Workspace: <span className="font-medium text-foreground">{currentWorkspace?.name || 'None'}</span>
          </div>
          <div className="mt-1">
            User: <span className="font-medium text-foreground">{user?.email || ''}</span>
          </div>
          {latestDiagramId && (
            <div className="mt-1">
              Latest diagram id: <span className="font-mono text-foreground">{latestDiagramId}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {steps.map((s) => (
          <Card key={s.key} className="p-4 bg-card/70 border-border/60 shadow-none rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{s.title}</div>
              <div className="flex items-center gap-2">
                {s.ok === null && <Badge variant="info">Not run</Badge>}
                {s.ok === true && <Badge variant="success">OK</Badge>}
                {s.ok === false && <Badge variant="error">Failed</Badge>}
              </div>
            </div>
            {s.detail && <div className="mt-2 text-sm text-muted-foreground">{s.detail}</div>}
            {s.data !== undefined && (
              <pre className="mt-3 text-xs whitespace-pre-wrap bg-background/80 border border-border rounded-xl p-3 overflow-auto">
                {JSON.stringify(s.data, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
