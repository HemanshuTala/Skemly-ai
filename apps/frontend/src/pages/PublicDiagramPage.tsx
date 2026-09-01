import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Lock, RefreshCw, Wifi, WifiOff, Eye, ExternalLink } from 'lucide-react'
import { DiagramCanvas } from '@/components/editor/DiagramCanvas'
import api from '@/lib/api'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip'
import { io, type Socket } from 'socket.io-client'
import { motion } from 'framer-motion'

const SOCKET_URL = '/'
const SESSION_KEY = (token: string) => `public_pw_${token}`

type PublicDiagram = {
  id: string
  title: string
  syntax: string
  nodes: any[]
  edges: any[]
}

export default function PublicDiagramPage() {
  const { token } = useParams<{ token: string }>()
  const [diagram, setDiagram] = useState<PublicDiagram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [liveUpdates, setLiveUpdates] = useState(0)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const socketRef = useRef<Socket | null>(null)

  const fetchPublicDiagram = useCallback(
    async (opts?: { password?: string; cancelled?: { value: boolean } }) => {
      if (!token) return
      try {
        setIsLoading(true)
        setError('')
        const res = opts?.password
          ? await api.post(`/diagrams/public/${token}`, { password: opts.password })
          : await api.get(`/diagrams/public/${token}`)
        const raw = res.data?.data
        if (opts?.cancelled?.value) return
        setRequiresPassword(false)
        setDiagram({
          id: raw?._id || raw?.id || '',
          title: raw?.title || 'Public Diagram',
          syntax: raw?.syntax || '',
          nodes: raw?.nodes || [],
          edges: raw?.edges || [],
        })
        if (opts?.password && token) {
          sessionStorage.setItem(SESSION_KEY(token), opts.password)
        }
      } catch (e: any) {
        if (opts?.cancelled?.value) return
        const code = e?.response?.data?.error?.code
        const message = e?.response?.data?.error?.message || 'Public diagram not available'
        if (code === 'AUTH_REQUIRED') {
          setRequiresPassword(true)
          setError('This public link is password protected')
        } else {
          setError(message)
        }
      } finally {
        if (!opts?.cancelled?.value) setIsLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (!token) return
    const cancelled = { value: false }
    const cached = sessionStorage.getItem(SESSION_KEY(token))
    void fetchPublicDiagram({ cancelled, password: cached || undefined })
    return () => {
      cancelled.value = true
    }
  }, [token, fetchPublicDiagram])

  useEffect(() => {
    if (!diagram?.id || !token) return

    const sock = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })
    socketRef.current = sock

    sock.on('connect', () => {
      setIsLive(true)
      sock.emit('join-diagram', { diagramId: diagram.id, isPublic: true })
    })

    sock.on('disconnect', () => {
      setIsLive(false)
    })

    sock.on('collaborators-update', (users: any[]) => {
      setCollaborators(users.filter((u) => u.userId !== 'public-viewer'))
    })

    sock.on('diagram-updated', (payload: any) => {
      setDiagram((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          syntax: payload.syntax,
          nodes: payload.nodes || [],
          edges: payload.edges || [],
        }
      })
      setLiveUpdates((n) => n + 1)
    })

    return () => {
      sock.disconnect()
      socketRef.current = null
      setIsLive(false)
    }
  }, [diagram?.id, token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
          <p className="text-[11px] font-bold text-[#52525b] uppercase tracking-widest animate-pulse">Loading shared system…</p>
        </div>
      </div>
    )
  }

  if (requiresPassword && !diagram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-8 shadow-2xl shadow-black/80 space-y-6"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <h1 className="text-[18px] font-bold text-white tracking-tight">Password Required</h1>
            <p className="text-xs text-[#52525b] leading-relaxed">This shared diagram is password protected.</p>
          </div>

          <div className="space-y-4">
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password) {
                  e.preventDefault()
                  setIsSubmittingPassword(true)
                  void fetchPublicDiagram({ password }).finally(() => setIsSubmittingPassword(false))
                }
              }}
              placeholder="Enter access password"
              className="w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
            />
            {error && <p className="text-[11px] text-[#f87171] text-center font-medium">{error}</p>}
            
            <div className="flex gap-2">
              <Link to="/" className="flex-1">
                <button className="w-full h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-[11px] font-semibold hover:bg-white/[0.08] transition-colors">
                  Cancel
                </button>
              </Link>
              <button
                disabled={!password || isSubmittingPassword}
                onClick={async () => {
                  if (!password) return
                  setIsSubmittingPassword(true)
                  try {
                    await fetchPublicDiagram({ password })
                  } finally {
                    setIsSubmittingPassword(false)
                  }
                }}
                className="flex-1 h-9 rounded-lg bg-white text-[#09090b] text-[11px] font-bold uppercase tracking-wider hover:bg-[#e4e4e7] disabled:opacity-40 transition-colors"
              >
                {isSubmittingPassword ? 'Unlocking…' : 'Unlock'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error || !diagram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center mx-auto">
            <WifiOff className="w-6 h-6 text-[#f87171]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Link Unavailable</h1>
            <p className="text-xs text-[#52525b] leading-relaxed">{error || 'Diagram not found or the link has expired.'}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-[#09090b] text-[11px] font-bold uppercase tracking-wider hover:bg-[#e4e4e7] transition-colors"
          >
            Go to Schemely
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#09090b] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-[52px] border-b border-white/[0.06] bg-[#0a0a0d]/80 backdrop-blur-xl px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            title="Schemely"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" />
              </svg>
            </div>
            <span className="text-[13px] font-bold tracking-tight text-white hidden sm:block">Schemely</span>
          </Link>

          <div className="w-px h-4 bg-white/[0.06] shrink-0" />

          {/* Diagram title */}
          <h1 className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-sm">{diagram.title}</h1>
        </div>

        {/* Action / indicators group */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            {collaborators.length > 0 && (
              <div className="flex items-center -space-x-1.5 mr-1">
                <TooltipProvider>
                  {collaborators.map((c) => (
                    <Tooltip key={c.userId}>
                      <TooltipTrigger asChild>
                        <div 
                          className="relative rounded-full p-0.5 bg-[#09090b] transition-transform hover:-translate-y-0.5 cursor-default"
                          style={{ zIndex: 10 }}
                        >
                          <div 
                            className="h-6 w-6 rounded-full border flex items-center justify-center text-[9px] font-black uppercase text-white"
                            style={{ borderColor: c.color, backgroundColor: `${c.color}20` }}
                          >
                            {(c.userName || 'C').charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-[#0e0e11] text-white border-white/[0.08] shadow-2xl">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold">{c.userName || 'Collaborator'}</span>
                          <span className="text-[9px] text-[#52525b]">Active editor</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            )}

            {isLive ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                Live
                {liveUpdates > 0 && <span className="opacity-70">· {liveUpdates}</span>}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[#52525b] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <Wifi className="w-3 h-3" />
                Connecting…
              </span>
            )}
            
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[#52525b] text-[10px] font-bold uppercase tracking-wider">
              <Eye className="w-3 h-3" />
              Read-only
            </span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Refresh & open in editor */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const cached = token ? sessionStorage.getItem(SESSION_KEY(token)) : null
                void fetchPublicDiagram({ password: cached || undefined })
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-colors"
              title="Refresh diagram"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white text-[#09090b] text-[11px] font-bold uppercase tracking-wider hover:bg-[#e4e4e7] transition-colors"
            >
              <span>Open App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 min-h-0 bg-[#09090b]">
        <DiagramCanvas
          syntax={diagram.syntax}
          visualData={{ nodes: diagram.nodes, edges: diagram.edges }}
        />
      </div>
    </div>
  )
}
