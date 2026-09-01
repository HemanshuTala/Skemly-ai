import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  FolderOpen,
  MoreVertical,
  Clock,
  Grid3x3,
  List,
  Edit,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  ArrowRight,
  FolderKanban,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDiagramStore } from '@/stores/diagramStore'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { ProjectIcon } from '@/components/projects/ProjectIcon'
import { cn } from '@/lib/utils'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery]       = useState('')
  const [viewMode, setViewMode]             = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { diagrams, fetchDiagrams } = useDiagramStore()

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects(currentWorkspace.id)
      fetchDiagrams({ workspaceId: currentWorkspace.id })
    }
  }, [currentWorkspace])

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDiagramCount = (projectId: string) =>
    diagrams.filter(d => d.projectId === projectId && !d.trashed).length

  const handleCreateProject = async (data: { name: string; icon?: string; color?: string }) => {
    if (!currentWorkspace) {
      toast.error('No workspace selected')
      return
    }
    await createProject(currentWorkspace.id, data)
    setShowCreateModal(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!currentWorkspace) return
    if (confirm('Delete this project? This cannot be undone.')) {
      await deleteProject(currentWorkspace.id, projectId)
    }
  }

  /* ── Loading skeleton ── */
  if (isLoading && projects.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28 rounded" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-[#0d0d10] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-2/3 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">Projects</h1>
          <p className="text-[13px] text-[#52525b] mt-0.5">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} in{' '}
            <span className="text-[#a1a1aa]">{currentWorkspace?.name || 'workspace'}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!currentWorkspace}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#09090b] text-[12px] font-bold hover:bg-[#e4e4e7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </motion.div>

      {/* ── Search + view toggle ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-[#52525b] hover:text-[#a1a1aa]'
            )}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-[#52525b] hover:text-[#a1a1aa]'
            )}
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredProjects.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-dashed border-white/[0.08] bg-[#0d0d10] py-16 text-center"
        >
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            {searchQuery ? <Search className="w-6 h-6 text-[#52525b]" /> : <FolderKanban className="w-6 h-6 text-[#52525b]" />}
          </div>
          <h3 className="text-[15px] font-semibold text-white mb-1.5">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-[13px] text-[#52525b] max-w-[240px] mx-auto mb-6 leading-relaxed">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'Organize your diagrams into projects for better collaboration'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#09090b] text-[12px] font-bold hover:bg-[#e4e4e7] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Project
            </button>
          )}
        </motion.div>
      )}

      {/* ── Grid view ── */}
      {viewMode === 'grid' && filteredProjects.length > 0 && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={item}>
              <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/30">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: project.color || '#27272a' }}
                    >
                      <ProjectIcon icon={project.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                        {project.name}
                      </h3>
                      <p className="text-[11px] text-[#52525b] mt-0.5">
                        {getDiagramCount(project.id)} diagram{getDiagramCount(project.id) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-all">
                        <MoreVertical className="w-3.5 h-3.5 text-[#71717a]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-[#f87171] focus:text-[#f87171]"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#52525b] mb-4">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                </div>

                {/* Open CTA */}
                <Link to="/dashboard">
                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[12px] text-[#a1a1aa] font-medium hover:bg-white/[0.07] hover:text-white transition-colors">
                    Open Project
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && filteredProjects.length > 0 && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-1.5"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={item}>
              <div className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/[0.05] bg-[#0d0d10] hover:border-white/[0.10] hover:bg-white/[0.02] transition-all">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: project.color || '#27272a' }}
                >
                  <ProjectIcon icon={project.icon} className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-white">{project.name}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-[#52525b] mt-0.5">
                    <span>{getDiagramCount(project.id)} diagrams</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to="/dashboard">
                    <button className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] text-white font-medium hover:bg-white/[0.08] transition-colors">
                      Open
                    </button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-all">
                        <MoreVertical className="w-3.5 h-3.5 text-[#71717a]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-[#f87171] focus:text-[#f87171]"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}
