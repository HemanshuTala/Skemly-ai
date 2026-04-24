import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Lock, RefreshCw, Wifi, WifiOff, Eye, ExternalLink } from 'lucide-react'
import { DiagramCanvas } from '@/components/editor/DiagramCanvas'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://ec2-13-60-224-91.eu-north-1.compute.amazonaws.com:5000'
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
  const [cursors, setCursors] = useState<any[]>([])
  const [selections, setSelections] = useState<any[]>([])
  const [collaborators, setCollaborators] = useState<any[]>([])
  const socketRef = useRef<Socket | null>(null)

  // Ã¢â€â‚¬Ã¢â€â‚¬ fetch Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
        // Cache the unlocked password so refresh doesn't ask again
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ initial load (uses cached password if any) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (!token) return
    const cancelled = { value: false }
    const cached = sessionStorage.getItem(SESSION_KEY(token))
    void fetchPublicDiagram({ cancelled, password: cached || undefined })
    return () => {
      cancelled.value = true
    }
  }, [token, fetchPublicDiagram])

  // Ã¢â€â‚¬Ã¢â€â‚¬ real-time socket (read-only public watcher) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
      sock.emit('diagram:public-join', { diagramId: diagram.id, token })
    })

    sock.on('disconnect', () => setIsLive(false))

    // Listen for live diagram changes emitted by an editor
    sock.on('diagram:change', (change: { type: string; data: any; userId: string }) => {
      setDiagram((prev) => {
        if (!prev) return prev
        if (change.type === 'syntax') return { ...prev, syntax: change.data }
        if (change.type === 'title') return { ...prev, title: change.data }
        if (change.type === 'graph') {
          return {
            ...prev,
            nodes: change.data.nodes || prev.nodes,
            edges: change.data.edges || prev.edges,
            syntax: change.data.syntax || prev.syntax
          }
        }
        return prev
      })

      if (change.type === 'selection') {
        const { nodeIds, edgeIds, userInfo } = change.data;
        setSelections((prev) => {
          const next = [...prev];
          const idx = next.findIndex((s) => s.userId === change.userId);
          if (nodeIds.length === 0 && edgeIds.length === 0) {
            return next.filter((s) => s.userId !== change.userId);
          }
          const selection = {
            userId: change.userId,
            userName: userInfo?.name || 'Collaborator',
            color: userInfo?.color || '#3b82f6',
            nodeIds,
            edgeIds,
          };
          if (idx >= 0) {
            next[idx] = selection;
          } else {
            next.push(selection);
          }
          return next;
        });
      }

      setLiveUpdates((n) => n + 1)
    })

    // Listen for cursor updates
    sock.on('cursor:update', (data: { socketId: string; x: number; y: number; userInfo: any }) => {
      setCursors((prev) => {
        const next = [...prev]
        const idx = next.findIndex((c) => c.userId === data.socketId)
        const cursor = {
          userId: data.socketId,
          userName: data.userInfo?.name || 'Collaborator',
          color: data.userInfo?.color || '#3b82f6',
          position: { x: data.x, y: data.y },
        }
        if (idx >= 0) {
          next[idx] = cursor
        } else {
          next.push(cursor)
        }
        return next
      })
    })

    sock.on('user:left', (data: { socketId: string }) => {
      setCursors((prev) => prev.filter((c) => c.userId !== data.socketId))
      setCollaborators((prev) => prev.filter((c) => c.userId !== data.socketId))
    })

    sock.on('user:joined', (data: { socketId: string; userId: string; userInfo: any }) => {
      setCollaborators((prev) => {
        if (prev.find((c) => c.userId === data.socketId)) return prev;
        return [...prev, {
          userId: data.socketId,
          userName: data.userInfo?.name || 'Collaborator',
          color: data.userInfo?.color || '#3b82f6',
        }];
      });
    })

    sock.on('presence:update', (data: { collaborators: any[] }) => {
      setCollaborators(data.collaborators.map(c => ({
        userId: c.userId,
        userName: c.userName,
        color: c.color,
        avatar: c.avatar
      })));
    })

    // Full sync if the editor sends one
    sock.on('diagram:full-sync', (payload: { syntax: string; nodes: any[]; edges: any[] }) => {
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ loading Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading diagram...</p>
        </div>
      </div>
    )
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ password gate Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (requiresPassword && !diagram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border/60 bg-card shadow-xl p-8 space-y-5">
            <div className="flex flex-col items-center gap-3 text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Password Required</h1>
              <p className="text-sm text-muted-foreground">This shared diagram is password protected.</p>
            </div>
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
              placeholder="Enter link password"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button
                className="flex-1"
                isLoading={isSubmittingPassword}
                onClick={async () => {
                  if (!password) return
                  setIsSubmittingPassword(true)
                  try {
                    await fetchPublicDiagram({ password })
                  } finally {
                    setIsSubmittingPassword(false)
                  }
                }}
              >
                Unlock
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ error Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (error || !diagram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link unavailable</h1>
          <p className="text-muted-foreground mb-6">{error || 'Diagram not found or the link has expired.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Skemly
          </Link>
        </div>
      </div>
    )
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ success Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-13 border-b border-border/70 bg-card/90 backdrop-blur-sm px-4 flex items-center gap-3">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors shrink-0"
          title="Skemly"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary fill-current">
              <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" />
            </svg>
          </div>
          <span className="text-[13px] font-bold tracking-tight hidden sm:block">Skemly</span>
        </Link>

        <div className="w-px h-4 bg-border/60 shrink-0" />

        {/* Diagram title */}
        <h1 className="font-semibold text-sm truncate min-w-0 flex-1">{diagram.title}</h1>

        {/* Live indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Collaborators */}
          <div className="flex items-center -space-x-2 mr-2">
            <TooltipProvider>
              {collaborators.map((c) => (
                <Tooltip key={c.userId}>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative rounded-full p-0.5 bg-background transition-transform hover:-translate-y-0.5 cursor-default"
                      style={{ zIndex: 10 }}
                    >
                      <Avatar className="h-7 w-7 border-2" style={{ borderColor: c.color }}>
                        {c.avatar ? <AvatarImage src={c.avatar} /> : null}
                        <AvatarFallback className="text-[10px] font-black" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                          {(c.userName || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold">{c.userName || 'Collaborator'}</span>
                      <span className="text-[9px] opacity-60">Editing now</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-500 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
              {liveUpdates > 0 && <span className="opacity-70">Ã‚Â· {liveUpdates} updates</span>}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
              <Wifi className="w-3 h-3" />
              Connecting...
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px]">
            <Eye className="w-3 h-3" />
            Read-only
          </span>
        </div>

        {/* Refresh & open in editor */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              const cached = token ? sessionStorage.getItem(SESSION_KEY(token)) : null
              void fetchPublicDiagram({ password: cached || undefined })
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh diagram"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            Open App
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Canvas - full remaining height */}
      <div className="flex-1 min-h-0">
        <DiagramCanvas
          syntax={diagram.syntax}
          visualData={{ nodes: diagram.nodes, edges: diagram.edges }}
        />
      </div>
    </div>
  )
}
