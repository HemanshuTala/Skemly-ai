import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Sparkles, FileText, Loader2, Plus } from 'lucide-react'
import { templateAPI } from '@/services/api.service'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import toast from 'react-hot-toast'

const categories = [
  { id: 'all', name: 'All Templates', icon: Sparkles },
  { id: 'flowchart', name: 'Flowcharts', icon: FileText },
  { id: 'sequence', name: 'Sequence', icon: FileText },
  { id: 'class', name: 'Class Diagrams', icon: FileText },
  { id: 'er', name: 'ER Diagrams', icon: FileText },
  { id: 'system', name: 'System Design', icon: FileText },
]

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {}
      const { data } = await templateAPI.list(params)
      setTemplates(data.data)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
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
        title: `${templateName} - Copy`,
      })
      toast.success('Diagram created from template')
      navigate(`/diagram/${data.data.id}`)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to use template'
      toast.error(message)
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title mb-2">Templates</h1>
            <p className="page-subtitle">
              Start with pre-built diagram templates
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className="gap-2 whitespace-nowrap"
          >
            <category.icon className="w-4 h-4" />
            {category.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search' : 'No templates available in this category'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden bg-card/90 border-border/80 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                  {template.thumbnail ? (
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {template.category}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{template.diagramType}</span>
                    <span>{template.usageCount || 0} uses</span>
                  </div>

                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleUseTemplate(template.id, template.name)}
                  >
                    <Plus className="w-4 h-4" />
                    Use Template
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State for No Workspace */}
      {!currentWorkspace && !isLoading && (
        <Card className="p-12 text-center mt-8 bg-card/90 border-border/80 shadow-md">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Select a workspace</h3>
          <p className="text-muted-foreground">
            Please select a workspace to use templates
          </p>
        </Card>
      )}
    </div>
  )
}
