import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
  FileText,
  Grid3x3,
  List,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDiagramStore } from '@/stores/diagramStore'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { ProjectIcon } from '@/components/projects/ProjectIcon'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getProjectDiagramCount = (projectId: string) => {
    return diagrams.filter(d => d.projectId === projectId && !d.trashed).length
  }

  const handleCreateProject = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    if (!currentWorkspace) {
      toast.error('No workspace loaded yet. Wait a moment or refresh the page.')
      return
    }

    try {
      await createProject(currentWorkspace.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!currentWorkspace) return
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(currentWorkspace.id, projectId)
    }
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-[#71717a] text-sm mt-1">
            {currentWorkspace?.name || 'Select a workspace'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!currentWorkspace}
          className="gap-2 bg-white text-[#18181b] hover:bg-[#e4e4e7] border-0"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mt-6 pt-6 border-t border-[#27272a]">
        <div>
          <div className="text-2xl font-bold text-white">{filteredProjects.length}</div>
          <div className="text-xs text-[#71717a] uppercase tracking-wider">Projects</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {filteredProjects.reduce((acc, p) => acc + getProjectDiagramCount(p.id), 0)}
          </div>
          <div className="text-xs text-[#71717a] uppercase tracking-wider">Diagrams</div>
        </div>
      </div>

      {/* Projects Grid */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 group bg-[#18181b] border-[#27272a] hover:border-[#3f3f46] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: project.color || '#3f3f46' }}
                    >
                      <ProjectIcon icon={project.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {project.name}
                      </h3>
                      <p className="text-xs text-[#71717a]">
                        {getProjectDiagramCount(project.id)} diagrams
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#27272a] border-[#3f3f46]">
                      <DropdownMenuItem className="text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] focus:bg-[#3f3f46] focus:text-white">
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#3f3f46]" />
                      <DropdownMenuItem 
                        className="text-[#f87171] hover:text-[#f87171] hover:bg-[#3f3f46] focus:bg-[#3f3f46]"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#71717a] mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                </div>

                <Link to="/dashboard">
                  <Button variant="outline" className="w-full bg-transparent border-[#3f3f46] text-white hover:bg-[#27272a] hover:text-white hover:border-[#52525b]">
                    Open Project
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Projects List */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="p-4 flex items-center justify-between rounded-lg border border-[#27272a] bg-[#18181b] hover:border-[#3f3f46] transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: project.color || '#3f3f46' }}
                >
                  <ProjectIcon icon={project.icon} className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-[#a1a1aa] transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[#71717a] mt-0.5">
                    <span>{getProjectDiagramCount(project.id)} diagrams</span>
                    <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#27272a] border-[#3f3f46]">
                  <DropdownMenuItem className="text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] focus:bg-[#3f3f46] focus:text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#3f3f46]" />
                  <DropdownMenuItem 
                    className="text-[#f87171] hover:text-[#f87171] hover:bg-[#3f3f46] focus:bg-[#3f3f46]"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#27272a] flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-[#a1a1aa]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-[#71717a] text-sm mb-6 max-w-sm">
            {searchQuery ? 'Try adjusting your search' : 'Create your first project to organize your diagrams'}
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-white text-[#18181b] hover:bg-[#e4e4e7]">
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        </div>
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
