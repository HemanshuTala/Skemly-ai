import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Sparkles,
  FileText,
  Plus,
  GitBranch,
  Layout,
  Database,
  Network,
  Layers,
  BarChart3,
} from 'lucide-react'
import { templateAPI } from '@/services/api.service'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'all',       label: 'All',         icon: Sparkles  },
  { id: 'flowchart', label: 'Flowchart',   icon: GitBranch },
  { id: 'sequence',  label: 'Sequence',    icon: Layout    },
  { id: 'class',     label: 'Class',       icon: Layers    },
  { id: 'er',        label: 'ER Diagram',  icon: Database  },
  { id: 'system',    label: 'System',      icon: Network   },
]

const TYPE_ICON: Record<string, React.ElementType> = {
  flowchart: GitBranch,
  sequence:  Layout,
  class:     Layers,
  er:        Database,
  network:   Network,
  system:    Network,
  mindmap:   BarChart3,
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [templates, setTemplates]             = useState<any[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const { currentWorkspace } = useWorkspaceStore()

  useEffect(() => { loadTemplates() }, [selectedCategory])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {}
      const { data } = await templateAPI.list(params)
      setTemplates(data.data)
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseTemplate = async (templateId: string, templateName: string) => {
    if (!currentWorkspace) {
      toast.error('Please select a workspace first')
      return
    }
    try {
      const { data } = await templateAPI.use(templateId, {
        workspaceId: currentWorkspace.id,
        title: `${templateName} Copy`,
      })
      toast.success('Diagram created from template')
      navigate(`/diagram/${data.data.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to use template')
    }
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">Templates</h1>
        <p className="text-[13px] text-[#52525b] mt-0.5">
          Start from a curated template instead of a blank canvas
        </p>
      </motion.div>

      {/* ── Search + category filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon
            const active  = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border',
                  active
                    ? 'bg-white/[0.10] text-white border-white/[0.15]'
                    : 'text-[#71717a] border-white/[0.06] hover:text-[#a1a1aa] hover:bg-white/[0.04] hover:border-white/[0.10]'
                )}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Count ── */}
      {!isLoading && (
        <p className="text-[12px] text-[#52525b]">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {/* ── Loading skeleton grid ── */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-[#0d0d10] overflow-hidden">
              <div className="aspect-video bg-white/[0.02] flex items-center justify-center">
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-8 w-full rounded-lg mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0d0d10] py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-[#52525b]" />
          </div>
          <h3 className="text-[14px] font-semibold text-white mb-1.5">No templates found</h3>
          <p className="text-[12px] text-[#52525b]">
            {searchQuery ? `No results for "${searchQuery}"` : 'No templates in this category yet'}
          </p>
        </div>
      )}

      {/* ── Template grid ── */}
      {!isLoading && filtered.length > 0 && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filtered.map((template) => {
            const TypeIcon = TYPE_ICON[template.diagramType] || FileText
            return (
              <motion.div key={template.id} variants={item}>
                <div className="group rounded-xl border border-white/[0.06] bg-[#0d0d10] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/30">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-white/[0.02] flex items-center justify-center relative overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-[#52525b]" />
                        </div>
                      </div>
                    )}
                    {/* Category overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md bg-black/60 text-[#a1a1aa] border border-white/[0.08] backdrop-blur-sm">
                        {template.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[14px] font-semibold text-white tracking-[-0.01em] line-clamp-1">
                        {template.name}
                      </h3>
                      <span className="shrink-0 text-[10px] text-[#52525b] font-medium">
                        {template.usageCount || 0} uses
                      </span>
                    </div>

                    <p className="text-[12px] text-[#52525b] leading-relaxed line-clamp-2 mb-4">
                      {template.description || 'A pre-built diagram template'}
                    </p>

                    <button
                      onClick={() => handleUseTemplate(template.id, template.name)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.07] bg-white/[0.04] text-[12px] text-white font-semibold hover:bg-white hover:text-[#09090b] hover:border-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Use Template
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
