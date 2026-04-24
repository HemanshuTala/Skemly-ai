import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export default function DiagramNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentWorkspace } = useWorkspaceStore()
  const { createDiagram } = useDiagramStore()

  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const run = async () => {
      setIsCreating(true)
      try {
        const diagram = await createDiagram({
          title: 'Untitled Diagram',
          type: 'flowchart',
          workspaceId: currentWorkspace?.id || 'default',
        })

        const aiQuery = location.search.includes('ai=1') ? '?ai=1' : ''
        navigate(`/diagram/${diagram.id}${aiQuery}`, { replace: true })
      } catch (e) {
        // Store already toasts the specific error (e.g. PLAN_LIMIT_REACHED)
        navigate('/dashboard', { replace: true })
      } finally {
        setIsCreating(false)
      }
    }

    void run()
  }, [currentWorkspace, createDiagram, navigate, location.search])

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Creating your diagram...</p>
      </div>
    </div>
  )
}

