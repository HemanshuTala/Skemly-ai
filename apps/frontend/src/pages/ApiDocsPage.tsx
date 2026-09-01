import { useState } from 'react'
import { motion } from 'framer-motion'
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

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

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
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0d]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 tracking-tight">API Documentation</h1>
              <p className="text-[#71717a] text-sm">Test and explore the Schemely REST API</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#a1a1aa] text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all">
                <Code2 className="w-4 h-4" />
                View OpenAPI Spec
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
            <input
              placeholder="Search endpoints..."
              className="w-full h-10 pl-10 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-[#52525b] text-sm focus:outline-none focus:border-white/[0.20] focus:bg-white/[0.03] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Endpoints List */}
          <div className="lg:col-span-1">
            <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto">
              <h3 className="text-sm font-semibold text-white mb-4">Endpoints</h3>
              <div className="space-y-1">
                {apiEndpoints.map((category) => (
                  <div key={category.category}>
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[#a1a1aa]" />
                        <span className="text-sm font-medium text-[#a1a1aa] group-hover:text-white transition-colors">{category.category}</span>
                      </div>
                      {expandedCategories.includes(category.category) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#52525b]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#52525b]" />
                      )}
                    </button>

                    {expandedCategories.includes(category.category) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="ml-5 mt-0.5 space-y-0.5"
                      >
                        {category.endpoints.map((endpoint, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedEndpoint({ ...endpoint, category: category.category })}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all ${
                              selectedEndpoint?.path === endpoint.path
                                ? 'bg-violet-500/10 border border-violet-500/20'
                                : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${methodColors[endpoint.method]}`}>
                                {endpoint.method}
                              </span>
                              {endpoint.auth && <Lock className="w-2.5 h-2.5 text-[#71717a]" />}
                            </div>
                            <div className="text-xs font-mono text-[#71717a] truncate">{endpoint.path}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - API Tester */}
          <div className="lg:col-span-2">
            {selectedEndpoint ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Endpoint Header */}
                <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${methodColors[selectedEndpoint.method]}`}>
                          {selectedEndpoint.method}
                        </span>
                        <code className="text-base font-mono text-white">{selectedEndpoint.path}</code>
                      </div>
                      <p className="text-[#71717a] text-sm">{selectedEndpoint.desc}</p>
                    </div>
                    {selectedEndpoint.auth && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Auth Required</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#52525b]">Base URL:</span>
                    <code className="text-xs bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg font-mono text-[#a1a1aa]">{BASE_URL}</code>
                    <button
                      onClick={() => copyToClipboard(`${BASE_URL}${selectedEndpoint.path}`)}
                      className="flex items-center gap-1 h-7 px-2 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.04] transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Request Body */}
                {['POST', 'PUT'].includes(selectedEndpoint.method) && (
                  <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-3">Request Body</h3>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={'{\n  "key": "value"\n}'}
                      className="w-full h-44 p-4 bg-[#09090b] border border-white/[0.06] rounded-xl font-mono text-sm text-[#a1a1aa] placeholder:text-[#3f3f46] resize-none focus:outline-none focus:border-white/[0.15] transition-all"
                    />
                  </div>
                )}

                {/* Send Request Button */}
                <button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>

                {/* Response */}
                {response && (
                  <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Response</h3>
                      <button
                        onClick={() => copyToClipboard(response)}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs text-[#71717a] hover:text-white hover:bg-white/[0.04] border border-white/[0.06] transition-all"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 bg-[#09090b] border border-white/[0.06] rounded-xl font-mono text-xs text-[#a1a1aa] overflow-x-auto leading-relaxed">
                      {response}
                    </pre>
                  </div>
                )}

                {/* Example Code */}
                <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Example Code</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-[#52525b] uppercase tracking-wider font-semibold mb-2">cURL</div>
                      <pre className="p-4 bg-[#09090b] border border-white/[0.06] rounded-xl font-mono text-xs text-[#a1a1aa] overflow-x-auto leading-relaxed">
{`curl -X ${selectedEndpoint.method} \\
  ${BASE_URL}${selectedEndpoint.path} \\
  -H "Content-Type: application/json" \\
  ${selectedEndpoint.auth ? '-H "Authorization: Bearer YOUR_TOKEN" \\\n  ' : ''}${['POST', 'PUT'].includes(selectedEndpoint.method) ? '-d \'{"key": "value"}\'' : ''}`}
                      </pre>
                    </div>

                    <div>
                      <div className="text-xs text-[#52525b] uppercase tracking-wider font-semibold mb-2">JavaScript (Axios)</div>
                      <pre className="p-4 bg-[#09090b] border border-white/[0.06] rounded-xl font-mono text-xs text-[#a1a1aa] overflow-x-auto leading-relaxed">
{`const response = await axios.${selectedEndpoint.method.toLowerCase()}(
  '${BASE_URL}${selectedEndpoint.path}',
  ${['POST', 'PUT'].includes(selectedEndpoint.method) ? '{ key: "value" },\n  ' : ''}{
    headers: {
      ${selectedEndpoint.auth ? '\'Authorization\': \'Bearer YOUR_TOKEN\',\n      ' : ''}'Content-Type': 'application/json'
    }
  }
)`}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Code2 className="w-7 h-7 text-[#52525b]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Select an endpoint</h3>
                <p className="text-[#71717a] text-sm max-w-xs mx-auto">
                  Choose an endpoint from the sidebar to test and view documentation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
