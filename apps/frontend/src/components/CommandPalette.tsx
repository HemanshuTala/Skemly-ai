import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useDiagramStore } from '@/stores/diagramStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspaceStore()
  const { diagrams } = useDiagramStore()

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKey)
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onOpenChange])

  if (!open) return null

  const recentDiagrams = diagrams.filter(d => !d.trashed).slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm">
      <Command className="w-full max-w-xl rounded-2xl bg-card border border-border/70 shadow-2xl overflow-hidden">
        <Command.Input
          autoFocus
          placeholder="Jump to diagram, project, or page..."
          className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2 text-sm">
          <Command.Empty className="px-3 py-2 text-muted-foreground">
            No results. Try a different keyword.
          </Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item
              onSelect={() => {
                navigate('/dashboard')
                onOpenChange(false)
              }}
            >
              Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => {
                navigate('/projects')
                onOpenChange(false)
              }}
            >
              Projects
            </Command.Item>
            <Command.Item
              onSelect={() => {
                navigate('/templates')
                onOpenChange(false)
              }}
            >
              Templates
            </Command.Item>
          </Command.Group>

          {recentDiagrams.length > 0 && (
            <Command.Group heading="Recent diagrams">
              {recentDiagrams.map((d) => (
                <Command.Item
                  key={d.id}
                  value={d.title}
                  onSelect={() => {
                    navigate(`/diagram/${d.id}`)
                    onOpenChange(false)
                  }}
                >
                  <span className="truncate">{d.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  )
}

