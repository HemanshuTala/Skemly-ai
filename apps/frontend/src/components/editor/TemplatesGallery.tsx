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
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = ALL_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    onSelect(template.code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d0d10] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Templates Gallery</h2>
              <p className="text-xs text-[#71717a]">Start quickly with {ALL_TEMPLATES.length} pre-built diagrams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar (horizontal scroll, sticky) */}
        <div className="px-6 py-3 border-b border-white/[0.05] bg-[#0a0a0d] shrink-0 sticky top-0 z-10 flex items-center gap-4">
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#0e0e11] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                    isActive
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1aa] hover:text-white border-transparent'
                  )}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#09090b]">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => {
                const IconComponent = ICON_MAP[template.icon] || Layers;
                return (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative bg-[#0e0e11] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.15] cursor-pointer group transition-all flex flex-col"
                  >
                    <div className="absolute inset-0 rounded-xl bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    
                    <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-[#71717a] leading-relaxed mt-1 flex-1">{template.description}</p>
                    
                    <div className="flex gap-1 flex-wrap mt-2">
                      {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-white/[0.04] text-[#52525b] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium uppercase border',
                          template.complexity === 'simple' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          template.complexity === 'medium' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                          template.complexity === 'complex' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                        )}>
                          {template.complexity}
                        </span>
                        <div className="text-xs text-[#52525b] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.estimatedTime}
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}
                        className="p-1.5 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                        title="Preview code"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-[#52525b]" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No templates found</p>
              <p className="text-xs text-[#71717a]">Try adjusting your search or filters</p>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-[60]"
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0d0d10] shadow-2xl overflow-hidden flex flex-col max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      {(() => {
                        const IconComponent = ICON_MAP[selectedTemplate.icon] || Layers;
                        return <IconComponent className="w-5 h-5 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{selectedTemplate.name}</h3>
                      <p className="text-xs text-[#71717a]">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-[#09090b] flex-1 overflow-y-auto">
                  <pre className="text-xs font-mono text-[#a1a1aa] whitespace-pre-wrap">
                    {selectedTemplate.code}
                  </pre>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.05] bg-[#0a0a0d]">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 rounded-lg bg-white/[0.04] text-white text-xs font-semibold hover:bg-white/[0.08] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleUseTemplate(selectedTemplate)}
                    className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
