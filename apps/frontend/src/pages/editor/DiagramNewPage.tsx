import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { CANONICAL_TEMPLATES } from '@/domain/templates'

export const TEMPLATE_PRESETS = CANONICAL_TEMPLATES;

export default function DiagramNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { createDiagram } = useDiagramStore()

  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const run = async () => {
      setIsCreating(true)
      try {
        let activeWorkspace = useWorkspaceStore.getState().currentWorkspace
        if (!activeWorkspace) {
          await useWorkspaceStore.getState().fetchWorkspaces()
          activeWorkspace = useWorkspaceStore.getState().currentWorkspace
        }

        const params = new URLSearchParams(location.search)
        const templateKey = params.get('template')
        const preset = templateKey ? TEMPLATE_PRESETS[templateKey] : null

        const title = preset?.title || params.get('title') || 'Untitled Diagram'
        const type = preset?.type || params.get('type') || 'flowchart'
        const syntax = preset?.syntax || ''

        const diagram = await createDiagram({
          title,
          type,
          workspaceId: activeWorkspace?.id || 'default',
          syntax: syntax || undefined,
        })

        const forwardParams = new URLSearchParams()
        if (params.get('ai') === '1') forwardParams.set('ai', '1')
        if (params.get('prompt')) forwardParams.set('prompt', params.get('prompt')!)

        const queryStr = forwardParams.toString() ? `?${forwardParams.toString()}` : ''
        navigate(`/diagram/${diagram.id}${queryStr}`, { replace: true })
      } catch (e) {
        navigate('/dashboard', { replace: true })
      } finally {
        setIsCreating(false)
      }
    }

    void run()
  }, [createDiagram, navigate, location.search])

  return (
    <div className="h-screen flex items-center justify-center bg-[#09090b]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="text-sm font-medium text-zinc-400">Initializing your architecture diagram...</p>
      </div>
    </div>
  )
}
