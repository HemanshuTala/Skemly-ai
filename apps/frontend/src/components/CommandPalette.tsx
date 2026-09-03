import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useDiagramStore } from '@/stores/diagramStore'
import {
  Search,
  LayoutDashboard,
  FolderOpen,
  LayoutTemplate,
  FileText,
  Building2,
  Settings,
  Plus,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
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

  const recentDiagrams = diagrams.filter(d => !d.trashed).slice(0, 5)

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-28 bg-black/60 backdrop-blur-sm px-4"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#0d0d10] shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col">
          {/* Input block */}
          <div 
            className="flex items-center gap-2.5 px-4 border-b border-white/[0.05] bg-[#0a0a0d]"
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Search className="w-4 h-4 text-[#52525b] shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search diagrams…"
              className="w-full py-3.5 text-[13px] text-white bg-transparent outline-none placeholder:text-[#3f3f46]"
            />
          </div>

          {/* List content */}
          <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin divide-y divide-white/[0.04]">
            <Command.Empty className="px-3 py-4 text-xs text-[#52525b] text-center">
              No results found for this keyword.
            </Command.Empty>

            {/* General Navigation */}
            <div className="py-1">
              <p className="text-[10px] font-bold text-[#3f3f46] uppercase tracking-[0.08em] px-3 py-2">
                Navigation
              </p>
              <Command.Item
                onSelect={() => {
                  navigate('/dashboard')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="flex-1">Go to Dashboard</span>
                <kbd className="text-[9px] font-mono bg-white/[0.05] border border-white/[0.08] text-[#52525b] px-1.5 py-0.5 rounded">G D</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate('/projects')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="flex-1">Go to Projects</span>
                <kbd className="text-[9px] font-mono bg-white/[0.05] border border-white/[0.08] text-[#52525b] px-1.5 py-0.5 rounded">G P</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate('/templates')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span className="flex-1">Browse Templates</span>
                <kbd className="text-[9px] font-mono bg-white/[0.05] border border-white/[0.08] text-[#52525b] px-1.5 py-0.5 rounded">G T</kbd>
              </Command.Item>
            </div>

            {/* Quick Actions */}
            <div className="py-1">
              <p className="text-[10px] font-bold text-[#3f3f46] uppercase tracking-[0.08em] px-3 py-2">
                Quick Actions
              </p>
              <Command.Item
                onSelect={() => {
                  navigate('/diagram/new')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Diagram</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate('/settings')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open Settings</span>
              </Command.Item>
            </div>

            {/* Recent diagrams */}
            {recentDiagrams.length > 0 && (
              <div className="py-1">
                <p className="text-[10px] font-bold text-[#3f3f46] uppercase tracking-[0.08em] px-3 py-2">
                  Recent Diagrams
                </p>
                {recentDiagrams.map((d) => (
                  <Command.Item
                    key={d.id}
                    value={d.title}
                    onSelect={() => {
                      navigate(`/diagram/${d.id}`)
                      onOpenChange(false)
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#a1a1aa] aria-selected:text-white aria-selected:bg-white/[0.06] transition-colors cursor-pointer select-none"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1">{d.title}</span>
                  </Command.Item>
                ))}
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
