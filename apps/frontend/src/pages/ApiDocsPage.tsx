import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Code2,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  FileText,
  Users,
  FolderOpen,
  MessageSquare,
  Bell,
  Search,
  Sparkles,
} from 'lucide-react'

const apiEndpoints = [
  {
    category: 'Authentication',
    icon: Lock,
    endpoints: [
      { method: 'POST', path: '/auth/register', desc: 'Register new user', auth: false },
      { method: 'POST', path: '/auth/login', desc: 'Login user', auth: false },
      { method: 'POST', path: '/auth/logout', desc: 'Logout user', auth: true },
      { method: 'POST', path: '/auth/refresh-token', desc: 'Refresh access token', auth: false },
      { method: 'POST', path: '/auth/forgot-password', desc: 'Request password reset', auth: false },
      { method: 'POST', path: '/auth/reset-password', desc: 'Reset password with token', auth: false },
      { method: 'POST', path: '/auth/verify-email', desc: 'Verify email address', auth: false },
      { method: 'GET', path: '/auth/me', desc: 'Get current user', auth: true },
      { method: 'PUT', path: '/auth/me', desc: 'Update profile', auth: true },
      { method: 'DELETE', path: '/auth/sessions/:sessionId', desc: 'Revoke session', auth: true },
    ]
  },
  {
    category: 'Diagrams',
    icon: FileText,
    endpoints: [
      { method: 'GET', path: '/diagrams', desc: 'List all diagrams', auth: true },
      { method: 'POST', path: '/diagrams', desc: 'Create diagram', auth: true },
      { method: 'GET', path: '/diagrams/:id', desc: 'Get diagram by ID', auth: true },
      { method: 'PUT', path: '/diagrams/:id', desc: 'Update diagram', auth: true },
      { method: 'DELETE', path: '/diagrams/:id', desc: 'Delete diagram', auth: true },
      { method: 'POST', path: '/diagrams/:id/duplicate', desc: 'Duplicate diagram', auth: true },
      { method: 'POST', path: '/diagrams/:id/star', desc: 'Star diagram', auth: true },
      { method: 'DELETE', path: '/diagrams/:id/star', desc: 'Unstar diagram', auth: true },
      { method: 'POST', path: '/diagrams/:id/trash', desc: 'Move to trash', auth: true },
      { method: 'POST', path: '/diagrams/:id/restore', desc: 'Restore from trash', auth: true },
      { method: 'POST', path: '/diagrams/:id/share', desc: 'Create share link', auth: true },
      { method: 'DELETE', path: '/diagrams/:id/share', desc: 'Revoke share link', auth: true },
      { method: 'GET', path: '/diagrams/public/:token', desc: 'Get public diagram', auth: false },
      { method: 'GET', path: '/diagrams/:id/versions', desc: 'Get version history', auth: true },
      { method: 'POST', path: '/diagrams/:id/versions', desc: 'Save version snapshot', auth: true },
      { method: 'GET', path: '/diagrams/:id/versions/:versionId', desc: 'Get specific version', auth: true },
      { method: 'POST', path: '/diagrams/:id/versions/:versionId/restore', desc: 'Restore version', auth: true },
    ]
  },
  {
    category: 'Workspaces',
    icon: FolderOpen,
    endpoints: [
      { method: 'GET', path: '/workspaces', desc: 'List workspaces', auth: true },
      { method: 'POST', path: '/workspaces', desc: 'Create workspace', auth: true },
      { method: 'GET', path: '/workspaces/:id', desc: 'Get workspace', auth: true },
      { method: 'PUT', path: '/workspaces/:id', desc: 'Update workspace', auth: true },
      { method: 'DELETE', path: '/workspaces/:id', desc: 'Delete workspace', auth: true },
      { method: 'GET', path: '/workspaces/:id/members', desc: 'Get members', auth: true },
      { method: 'POST', path: '/workspaces/:id/invite', desc: 'Invite member', auth: true },
      { method: 'DELETE', path: '/workspaces/:id/members/:userId', desc: 'Remove member', auth: true },
      { method: 'PUT', path: '/workspaces/:id/members/:userId/role', desc: 'Update member role', auth: true },
      { method: 'POST', path: '/workspaces/:id/transfer-ownership', desc: 'Transfer ownership', auth: true },
      { method: 'GET', path: '/workspaces/:id/activity', desc: 'Get activity log', auth: true },
    ]
  },
  {
    category: 'Projects',
    icon: FolderOpen,
    endpoints: [
      { method: 'GET', path: '/workspaces/:wsId/projects', desc: 'List projects', auth: true },
      { method: 'POST', path: '/workspaces/:wsId/projects', desc: 'Create project', auth: true },
      { method: 'PUT', path: '/workspaces/:wsId/projects/:id', desc: 'Update project', auth: true },
      { method: 'DELETE', path: '/workspaces/:wsId/projects/:id', desc: 'Delete project', auth: true },
    ]
  },
  {
    category: 'AI',
    icon: Sparkles,
    endpoints: [
      { method: 'POST', path: '/ai/generate', desc: 'Generate diagram from prompt', auth: true },
      { method: 'POST', path: '/ai/explain', desc: 'Explain diagram', auth: true },
      { method: 'POST', path: '/ai/improve', desc: 'Get improvement suggestions', auth: true },
      { method: 'POST', path: '/ai/autofix', desc: 'Auto-fix syntax errors', auth: true },
      { method: 'GET', path: '/ai/usage', desc: 'Get AI usage stats', auth: true },
    ]
  },
  {
    category: 'Notes',
    icon: FileText,
    endpoints: [
      { method: 'GET', path: '/notes/:diagramId', desc: 'Get notes', auth: true },
      { method: 'PUT', path: '/notes/:diagramId', desc: 'Update notes', auth: true },
      { method: 'GET', path: '/notes/:diagramId/versions', desc: 'Get note versions', auth: true },
      { method: 'POST', path: '/notes/:diagramId/publish', desc: 'Publish notes', auth: true },
      { method: 'DELETE', path: '/notes/:diagramId/publish', desc: 'Unpublish notes', auth: true },
    ]
  },
  {
    category: 'Comments',
    icon: MessageSquare,
    endpoints: [
      { method: 'GET', path: '/diagrams/:id/comments', desc: 'Get comments', auth: true },
      { method: 'POST', path: '/diagrams/:id/comments', desc: 'Create comment', auth: true },
      { method: 'PUT', path: '/diagrams/:id/comments/:commentId', desc: 'Update comment', auth: true },
      { method: 'DELETE', path: '/diagrams/:id/comments/:commentId', desc: 'Delete comment', auth: true },
      { method: 'POST', path: '/diagrams/:id/comments/:commentId/resolve', desc: 'Resolve comment', auth: true },
      { method: 'POST', path: '/diagrams/:id/comments/:commentId/reply', desc: 'Reply to comment', auth: true },
    ]
  },
  {
    category: 'Templates',
    icon: FileText,
    endpoints: [
      { method: 'GET', path: '/templates', desc: 'List templates', auth: false },
      { method: 'POST', path: '/templates', desc: 'Create template', auth: true },
      { method: 'GET', path: '/templates/:id', desc: 'Get template', auth: false },
      { method: 'DELETE', path: '/templates/:id', desc: 'Delete template', auth: true },
      { method: 'POST', path: '/templates/:id/use', desc: 'Use template', auth: true },
    ]
  },
  {
    category: 'Export',
    icon: FileText,
    endpoints: [
      { method: 'POST', path: '/export/png', desc: 'Export as PNG', auth: true },
      { method: 'POST', path: '/export/svg', desc: 'Export as SVG', auth: true },
      { method: 'POST', path: '/export/pdf', desc: 'Export as PDF', auth: true },
      { method: 'POST', path: '/export/syntax', desc: 'Export syntax', auth: true },
      { method: 'GET', path: '/export/status/:jobId', desc: 'Get export status', auth: true },
      { method: 'GET', path: '/export/download/:fileId', desc: 'Download export', auth: true },
    ]
  },
  {
    category: 'Notifications',
    icon: Bell,
    endpoints: [
      { method: 'GET', path: '/notifications', desc: 'Get notifications', auth: true },
      { method: 'PUT', path: '/notifications/:id/read', desc: 'Mark as read', auth: true },
      { method: 'POST', path: '/notifications/read-all', desc: 'Mark all as read', auth: true },
      { method: 'DELETE', path: '/notifications/:id', desc: 'Delete notification', auth: true },
      { method: 'PUT', path: '/notifications/preferences', desc: 'Update preferences', auth: true },
    ]
  },
  {
    category: 'Search',
    icon: Search,
    endpoints: [
      { method: 'GET', path: '/search', desc: 'Search diagrams and notes', auth: true },
    ]
  },
  {
    category: 'Billing',
    icon: Users,
    endpoints: [
      { method: 'GET', path: '/billing/plans', desc: 'Get available plans', auth: false },
      { method: 'GET', path: '/billing/subscription', desc: 'Get subscription', auth: true },
      { method: 'POST', path: '/billing/subscribe', desc: 'Subscribe to plan', auth: true },
      { method: 'POST', path: '/billing/cancel', desc: 'Cancel subscription', auth: true },
      { method: 'POST', path: '/billing/portal', desc: 'Get billing portal link', auth: true },
      { method: 'POST', path: '/billing/webhook', desc: 'Webhook handler', auth: false },
    ]
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-500 border-green-500/20',
  PUT: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Authentication'])
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const handleSendRequest = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setResponse(JSON.stringify({
        success: true,
        data: { message: 'This is a mock response' },
        timestamp: new Date().toISOString()
      }, null, 2))
      setLoading(false)
    }, 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">API Documentation</h1>
              <p className="text-muted-foreground">Test and explore Skemly REST API</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Code2 className="w-4 h-4" />
                View OpenAPI Spec
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search endpoints..." className="pl-10" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Endpoints List */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <h3 className="font-semibold mb-4">Endpoints</h3>
              <div className="space-y-2">
                {apiEndpoints.map((category) => (
                  <div key={category.category}>
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      {expandedCategories.includes(category.category) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {expandedCategories.includes(category.category) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="ml-6 mt-2 space-y-1"
                      >
                        {category.endpoints.map((endpoint, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedEndpoint({ ...endpoint, category: category.category })}
                            className={`w-full text-left p-2 rounded-lg hover:bg-muted transition-colors ${
                              selectedEndpoint?.path === endpoint.path ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded border font-mono ${methodColors[endpoint.method]}`}>
                                {endpoint.method}
                              </span>
                              {endpoint.auth && <Lock className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground">{endpoint.path}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content - API Tester */}
          <div className="lg:col-span-2">
            {selectedEndpoint ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Endpoint Header */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded border font-mono font-semibold ${methodColors[selectedEndpoint.method]}`}>
                          {selectedEndpoint.method}
                        </span>
                        <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                      </div>
                      <p className="text-muted-foreground">{selectedEndpoint.desc}</p>
                    </div>
                    {selectedEndpoint.auth && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-medium">Auth Required</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Base URL:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">http://localhost:5000/api/v1</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`http://localhost:5000/api/v1${selectedEndpoint.path}`)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </Card>

                {/* Request Body */}
                {['POST', 'PUT'].includes(selectedEndpoint.method) && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Request Body</h3>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{\n  "key": "value"\n}'
                      className="w-full h-48 p-4 bg-muted rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </Card>
                )}

                {/* Send Request Button */}
                <Button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </Button>

                {/* Response */}
                {response && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Response</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(response)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
                      {response}
                    </pre>
                  </Card>
                )}

                {/* Example Code */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Example Code</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">cURL</div>
                      <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
{`curl -X ${selectedEndpoint.method} \\
  http://localhost:5000/api/v1${selectedEndpoint.path} \\
  -H "Content-Type: application/json" \\
  ${selectedEndpoint.auth ? '-H "Authorization: Bearer YOUR_TOKEN" \\\n  ' : ''}${['POST', 'PUT'].includes(selectedEndpoint.method) ? '-d \'{"key": "value"}\'' : ''}`}
                      </pre>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">JavaScript (Axios)</div>
                      <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
{`const response = await axios.${selectedEndpoint.method.toLowerCase()}(
  'http://localhost:5000/api/v1${selectedEndpoint.path}',
  ${['POST', 'PUT'].includes(selectedEndpoint.method) ? '{ key: "value" },\n  ' : ''}{
    headers: {
      ${selectedEndpoint.auth ? '\'Authorization\': \'Bearer YOUR_TOKEN\',\n      ' : ''}'Content-Type': 'application/json'
    }
  }
)`}
                      </pre>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Code2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select an endpoint</h3>
                <p className="text-muted-foreground">
                  Choose an endpoint from the sidebar to test and view documentation
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
