import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  FilePlus2,
  Loader2,
  Sparkles,
  Workflow,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { CANONICAL_TEMPLATES } from '@/domain/templates'

export const TEMPLATE_PRESETS = CANONICAL_TEMPLATES

const featuredTemplates = Object.values(TEMPLATE_PRESETS).slice(0, 3)

export default function DiagramNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { createDiagram } = useDiagramStore()
  const [isCreating, setIsCreating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [launchError, setLaunchError] = useState('')
  const isCreatingRef = useRef(false)
  const retryParamsRef = useRef(new URLSearchParams())

  const createAndOpen = useCallback(async (params: URLSearchParams) => {
    if (isCreatingRef.current) return
    isCreatingRef.current = true
    retryParamsRef.current = new URLSearchParams(params)
    setIsCreating(true)
    setLaunchError('')

    try {
      let activeWorkspace = useWorkspaceStore.getState().currentWorkspace
      if (!activeWorkspace) {
        await useWorkspaceStore.getState().fetchWorkspaces()
        activeWorkspace = useWorkspaceStore.getState().currentWorkspace
      }

      const templateKey = params.get('template')
      const preset = templateKey ? TEMPLATE_PRESETS[templateKey] : null
      const promptText = params.get('prompt')?.trim()
      const titleFromPrompt = promptText?.split(/\s+/).slice(0, 6).join(' ')
      const title = preset?.title || params.get('title') || titleFromPrompt || 'Untitled Diagram'
      const type = preset?.type || params.get('type') || 'flowchart'

      const diagram = await createDiagram({
        title,
        type,
        workspaceId: activeWorkspace?.id || 'default',
        syntax: preset?.syntax || undefined,
      })

      const forwardParams = new URLSearchParams()
      if (params.get('ai') === '1') forwardParams.set('ai', '1')
      if (promptText) forwardParams.set('prompt', promptText)
      const queryString = forwardParams.toString()
      const query = queryString ? `?${queryString}` : ''
      navigate(`/diagram/${diagram.id}${query}`, { replace: true })
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Could not create the diagram. Please try again.'
      setLaunchError(message)
    } finally {
      isCreatingRef.current = false
      setIsCreating(false)
    }
  }, [createDiagram, navigate])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hasLaunchIntent = ['template', 'title', 'type', 'ai', 'prompt'].some((key) => params.has(key))
    if (hasLaunchIntent) void createAndOpen(params)
  }, [createAndOpen, location.search])

  const createBlank = () => {
    void createAndOpen(new URLSearchParams())
  }

  const generateFromPrompt = () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error('Describe the architecture you want to create.')
      return
    }

    const params = new URLSearchParams({ ai: '1', prompt: trimmedPrompt })
    void createAndOpen(params)
  }

  if (isCreating) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white grid place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10">
            <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
          </div>
          <h1 className="text-base font-semibold">Preparing your workspace</h1>
          <p className="mt-2 text-sm text-zinc-400">Setting up your diagram canvas…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#09090b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.13),transparent_48%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Dashboard
          </button>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-zinc-400">
            NEW DIAGRAM
          </span>
        </header>

        <section className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 shadow-[0_0_48px_rgba(124,58,237,0.16)]">
            <Workflow className="h-5 w-5 text-violet-300" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Architecture starts here</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">What would you like to make?</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Start with a blank canvas, describe your system to AI, or adapt a proven architecture template.
          </p>
        </section>

        {launchError && (
          <div role="alert" className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">
            <span>{launchError}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void createAndOpen(retryParamsRef.current)}
                className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-white/10"
              >
                Try again
              </button>
              <button type="button" onClick={() => setLaunchError('')} className="rounded-md px-2 py-1 text-xs font-semibold text-rose-100/70 hover:bg-white/10">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <section className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-3">
          <article className="group rounded-2xl border border-white/[0.09] bg-[#101014] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#131319]">
            <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold">Start from scratch</h2>
            <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">Open a clean canvas and shape the system your way.</p>
            <button
              type="button"
              onClick={createBlank}
              className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Blank diagram <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.12] via-[#111016] to-[#101014] p-5 shadow-[0_16px_60px_rgba(90,40,180,0.08)]">
            <div className="absolute right-5 top-5 rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[10px] font-semibold text-violet-200">
              AI POWERED
            </div>
            <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold">Generate with AI</h2>
            <p className="mt-2 text-sm leading-5 text-zinc-400">Describe the architecture and refine it in the editor.</p>
            <label htmlFor="architecture-prompt" className="sr-only">Describe your architecture</label>
            <textarea
              id="architecture-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) generateFromPrompt()
              }}
              rows={3}
              placeholder="e.g. A secure e-commerce system with an API gateway, services, and a database…"
              className="mt-4 w-full resize-y rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-500">Ctrl + Enter to generate</span>
              <button
                type="button"
                onClick={generateFromPrompt}
                disabled={!prompt.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-500 px-3 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                Generate <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-white/[0.09] bg-[#101014] p-5 transition hover:border-white/20 hover:bg-[#131319]">
            <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200">
              <Boxes className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold">Use a template</h2>
            <p className="mt-2 text-sm leading-5 text-zinc-400">Begin with a useful system blueprint, then make it yours.</p>
            <div className="mt-4 space-y-2">
              {featuredTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => navigate(`/diagram/new?template=${encodeURIComponent(template.id)}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-violet-300/20 hover:bg-violet-300/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-zinc-200">{template.title}</span>
                    <span className="mt-0.5 block text-[10px] capitalize text-zinc-500">{template.category}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="mt-4 inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-violet-300 transition hover:text-violet-200"
            >
              Browse all templates <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </article>
        </section>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Your diagrams are saved to your active workspace.
        </p>
      </div>
    </main>
  )
}
