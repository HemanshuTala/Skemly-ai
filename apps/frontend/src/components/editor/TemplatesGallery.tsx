import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  GitBranch, 
  Server, 
  Database, 
  Activity, 
  GitMerge, 
  Box,
  Clock,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Eye,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Cloud,
  Cpu,
  Lock,
  Users,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Bell,
  Workflow,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AI_PROMPT_TEMPLATES } from '@/lib/aiPrompts';

const ICON_MAP: Record<string, React.ElementType> = {
  GitBranch,
  Server,
  Database,
  Activity,
  GitMerge,
  Box,
  Clock,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Cloud,
  Cpu,
  Lock,
  Users,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Bell,
  Workflow,
};

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  code: string;
  preview?: string;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  estimatedTime: string;
}

const ADDITIONAL_TEMPLATES: Template[] = [
  {
    id: 'auth-oauth',
    name: 'OAuth2 Flow',
    description: 'Complete OAuth2 authentication sequence with authorization code flow',
    category: 'authentication',
    icon: 'Lock',
    complexity: 'complex',
    tags: ['auth', 'oauth', 'security', 'flow'],
    estimatedTime: '10 min',
    code: `actor: User
participant: Browser
participant: AuthServer
participant: ResourceServer

User ->> Browser: Click Login
Browser ->> AuthServer: GET /authorize
AuthServer -->> Browser: Login Page
User ->> Browser: Enter Credentials
Browser ->> AuthServer: POST /login
AuthServer ->> AuthServer: Validate
AuthServer -->> Browser: Auth Code
Browser ->> AuthServer: POST /token
AuthServer ->> ResourceServer: Verify
ResourceServer -->> AuthServer: User Data
AuthServer -->> Browser: Access Token
Browser ->> ResourceServer: API Call
ResourceServer -->> Browser: Protected Data`,
  },
  {
    id: 'microservices-k8s',
    name: 'Kubernetes Architecture',
    description: 'Container orchestration with services, pods, ingress, and persistent storage',
    category: 'architecture',
    icon: 'Cloud',
    complexity: 'complex',
    tags: ['k8s', 'docker', 'devops', 'cloud'],
    estimatedTime: '15 min',
    code: `[Ingress Controller] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [User Service]
[API Gateway] --> [Order Service]

[Auth Service] --> [[Redis Session]]
[User Service] --> [[PostgreSQL]]
[Order Service] --> [[Order DB]]

[User Service] --> [Message Queue]
[Order Service] --> [Message Queue]
[Message Queue] --> [Worker Pods]

[Worker Pods] --> [[S3 Storage]]
[Monitoring] --> [Prometheus]
[Prometheus] --> [Grafana]`,
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    description: 'Async processing with event bus, consumers, and dead letter queues',
    category: 'architecture',
    icon: 'Zap',
    complexity: 'medium',
    tags: ['events', 'async', 'microservices', 'kafka'],
    estimatedTime: '12 min',
    code: `[Client] --> [API Gateway]
[API Gateway] --> [Event Bus]

[Event Bus] --> [Order Service]
[Event Bus] --> [Inventory Service]
[Event Bus] --> [Payment Service]
[Event Bus] --> [Notification Service]

[Order Service] --> [[Order DB]]
[Order Service] --> [Event Bus]: OrderCreated

[Inventory Service] --> [[Inventory DB]]
[Inventory Service] --> [Event Bus]: InventoryReserved

[Payment Service] --> [[Payment DB]]
[Payment Service] --> [Event Bus]: PaymentProcessed

[Notification Service] --> [Email API]
[Notification Service] --> [SMS API]

[Dead Letter Queue] --> [Error Handler]`,
  },
  {
    id: 'ci-cd-pipeline',
    name: 'CI/CD Pipeline',
    description: 'Complete deployment pipeline from commit to production',
    category: 'devops',
    icon: 'Workflow',
    complexity: 'medium',
    tags: ['cicd', 'devops', 'deployment', 'automation'],
    estimatedTime: '8 min',
    code: `[Developer] --> [Push Code]
[Push Code] --> [Git Repository]

[Git Repository] --> [Webhook]
[Webhook] --> [CI Server]

[CI Server] --> [Run Tests]
[Run Tests] --> {Tests Pass?}

{Tests Pass?} -- No --> [Notify Failure]
{Tests Pass?} -- Yes --> [Build Docker Image]

[Build Docker Image] --> [Push to Registry]
[Push to Registry] --> [Deploy Staging]

[Deploy Staging] --> [Run E2E Tests]
[Run E2E Tests] --> {E2E Pass?}

{E2E Pass?} -- Yes --> [Deploy Production]
{E2E Pass?} -- No --> [Rollback]

[Deploy Production] --> [Update Load Balancer]
[Update Load Balancer] --> [Health Check]
[Health Check] --> {Healthy?}
{Healthy?} -- No --> [Rollback]
{Healthy?} -- Yes --> [Notify Success]`,
  },
  {
    id: 'payment-flow',
    name: 'Payment Processing',
    description: 'Multi-gateway payment flow with fraud detection and reconciliation',
    category: 'business',
    icon: 'CreditCard',
    complexity: 'complex',
    tags: ['payments', 'fintech', 'transactions', 'stripe'],
    estimatedTime: '12 min',
    code: `[Customer] --> [Checkout Page]
[Checkout Page] --> [Payment Gateway]

[Payment Gateway] --> {Fraud Check}
{Fraud Check} -- High Risk --> [Block Transaction]
{Fraud Check} -- Low Risk --> [Process Payment]

[Process Payment] --> [Stripe API]
[Process Payment] --> [PayPal API]
[Process Payment] --> [Bank Transfer]

[Stripe API] --> {Payment Success?}
[PayPal API] --> {Payment Success?}

{Payment Success?} -- Yes --> [Update Order]
{Payment Success?} -- No --> [Retry Logic]

[Retry Logic] --> {Retry Count < 3?}
{Retry Count < 3?} -- Yes --> [Wait 5s] --> [Process Payment]
{Retry Count < 3?} -- No --> [Payment Failed]

[Update Order] --> [Send Receipt]
[Update Order] --> [Update Inventory]
[Update Order] --> [Trigger Webhook]

[Payment Failed] --> [Send Failure Email]
[Payment Failed] --> [Log for Review]`,
  },
  {
    id: 'notification-system',
    name: 'Notification System',
    description: 'Multi-channel notifications with preferences and batching',
    category: 'system',
    icon: 'Bell',
    complexity: 'medium',
    tags: ['notifications', 'email', 'sms', 'push'],
    estimatedTime: '10 min',
    code: `[Event Trigger] --> [Notification Service]
[Notification Service] --> [[Queue]]

[[Queue]] --> [Priority Router]
[Priority Router] --> {Priority?}

{Priority?} -- High --> [Immediate Worker]
{Priority?} -- Normal --> [Batch Worker]
{Priority?} -- Low --> [Scheduled Worker]

[Immediate Worker] --> [User Preferences]
[Batch Worker] --> [User Preferences]
[Scheduled Worker] --> [User Preferences]

[User Preferences] --> {Channel Enabled?}
{Channel Enabled?} -- Email --> [Email Service]
{Channel Enabled?} -- SMS --> [SMS Gateway]
{Channel Enabled?} -- Push --> [Push Service]
{Channel Enabled?} -- In-App --> [WebSocket]

[Email Service] --> [SendGrid API]
[SMS Gateway] --> [Twilio API]
[Push Service] --> [FCM/APNS]
[WebSocket] --> [Client App]

[Rate Limiter] --> [User Preferences]`,
  },
];

const ALL_TEMPLATES = [...AI_PROMPT_TEMPLATES.map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  category: t.category,
  icon: t.icon,
  code: t.exampleOutput,
  complexity: 'medium' as const,
  tags: [t.category],
  estimatedTime: '8 min',
})), ...ADDITIONAL_TEMPLATES];

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Layers },
  { id: 'flowchart', name: 'Flowcharts', icon: GitBranch },
  { id: 'architecture', name: 'Architecture', icon: Server },
  { id: 'authentication', name: 'Authentication', icon: Lock },
  { id: 'devops', name: 'DevOps', icon: Workflow },
  { id: 'business', name: 'Business', icon: CreditCard },
  { id: 'system', name: 'System Design', icon: Cpu },
];

interface TemplatesGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
}

export function TemplatesGallery({ isOpen, onClose, onSelect }: TemplatesGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = ALL_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (template: Template) => {
    onSelect(template.code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl max-h-[85vh] rounded-2xl border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Template Gallery</h2>
              <p className="text-xs text-[#71717a]">Choose from {ALL_TEMPLATES.length} pre-built diagrams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and filters */}
        <div className="px-6 py-4 border-b border-[#27272a] space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#27272a] border border-[#3f3f46] rounded-xl text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-[#3f3f46] text-white' : 'text-[#71717a] hover:bg-[#27272a]'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-[#3f3f46] text-white' : 'text-[#71717a] hover:bg-[#27272a]'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-white text-[#18181b]'
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white'
                  )}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates grid/list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}>
            {filteredTemplates.map((template) => {
              const IconComponent = ICON_MAP[template.icon] || Layers;
              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'group relative border border-[#27272a] bg-[#18181b] rounded-xl overflow-hidden',
                    'hover:border-[#3f3f46] transition-all duration-300',
                    viewMode === 'list' && 'flex items-center gap-4 p-3'
                  )}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-video bg-[#09090b] border-b border-[#27272a] p-4">
                        <pre className="text-[10px] font-mono text-[#52525b] line-clamp-6 overflow-hidden">
                          {template.code}
                        </pre>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-white mb-1">{template.name}</h3>
                            <p className="text-xs text-[#71717a] line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                              template.complexity === 'simple' && 'bg-green-500/10 text-green-400',
                              template.complexity === 'medium' && 'bg-amber-500/10 text-amber-400',
                              template.complexity === 'complex' && 'bg-red-500/10 text-red-400',
                            )}>
                              {template.complexity}
                            </span>
                            <span className="text-[10px] text-[#71717a]">{template.estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(template.code, template.id)}
                              className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
                              title="Copy code"
                            >
                              {copiedId === template.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setSelectedTemplate(template)}
                              className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Button
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                              className="ml-1"
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-white">{template.name}</h3>
                        <p className="text-xs text-[#71717a] truncate">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                          template.complexity === 'simple' && 'bg-green-500/10 text-green-400',
                          template.complexity === 'medium' && 'bg-amber-500/10 text-amber-400',
                          template.complexity === 'complex' && 'bg-red-500/10 text-red-400',
                        )}>
                          {template.complexity}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(template.code, template.id)}
                            className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a]"
                          >
                            {copiedId === template.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <Button size="sm" onClick={() => handleUseTemplate(template)}>Use</Button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="w-12 h-12 text-[#3f3f46] mb-4" />
              <p className="text-lg font-semibold text-white mb-1">No templates found</p>
              <p className="text-sm text-[#71717a]">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl rounded-2xl border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#27272a] border border-[#3f3f46] flex items-center justify-center">
                      {(() => {
                        const IconComponent = ICON_MAP[selectedTemplate.icon] || Layers;
                        return <IconComponent className="w-5 h-5 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedTemplate.name}</h3>
                      <p className="text-xs text-[#71717a]">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 bg-[#09090b]">
                  <pre className="text-sm font-mono text-[#a1a1aa] overflow-x-auto">
                    {selectedTemplate.code}
                  </pre>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
                  <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Close</Button>
                  <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                    Use Template
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
