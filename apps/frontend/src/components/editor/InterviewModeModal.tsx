import { useState } from 'react';
import { Modal } from '../ui/modal';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Compass, Cpu, Database, Network } from 'lucide-react';
import { aiAPI } from '@/services/api.service';
import { cn } from '@/lib/utils';

interface InterviewModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramType: string;
  diagramId: string;
  onGenerate: (syntax: string) => void;
}

interface StepOption {
  value: string;
  label: string;
  desc?: string;
  icon?: any;
}

interface InterviewStep {
  title: string;
  key: string;
  question: string;
  options: StepOption[];
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function InterviewModeModal({
  isOpen,
  onClose,
  diagramType,
  onGenerate,
}: InterviewModeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customValue, setCustomValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isSequence = diagramType?.toLowerCase().includes('sequence');

  const flowchartSteps: InterviewStep[] = [
    {
      title: 'Domain & Purpose',
      key: 'domain',
      question: 'What type of system architecture are we designing?',
      options: [
        { value: 'E-Commerce store', label: 'E-Commerce system', desc: 'Shop, cart, checkout, payment gateway, inventory.', icon: Compass },
        { value: 'Real-time Chat App', label: 'Real-time Messaging', desc: 'WebSockets, message storage, presence service, notifications.', icon: Compass },
        { value: 'SaaS Platform with Microservices', label: 'SaaS Platform', desc: 'Auth, tenants, API gateway, billing, user settings.', icon: Compass },
        { value: 'Data Ingestion & Analytics pipeline', label: 'Data Analytics Pipeline', desc: 'Kafka, stream processing, data lake, storage.', icon: Compass },
      ],
      allowCustom: true,
      customPlaceholder: 'Or enter custom domain (e.g. Video Streaming system)...',
    },
    {
      title: 'Scale & Performance',
      key: 'scale',
      question: 'What are the expected scaling and load requirements?',
      options: [
        { value: 'Single instance server, simple stack', label: 'Standard Scale', desc: 'Low cost, minimal complexity, single replica.', icon: Cpu },
        { value: 'Load balancer, multiple replicas, autoscale', label: 'High Availability', desc: 'Redundant servers, zero downtime updates.', icon: Cpu },
        { value: 'Massive scale with caching, CDN, edge routing', label: 'Global Scale', desc: 'Millions of users, edge caching, ultra low latency.', icon: Cpu },
      ],
    },
    {
      title: 'State & Databases',
      key: 'database',
      question: 'What primary database configuration will be used?',
      options: [
        { value: 'Relational Database (PostgreSQL/MySQL)', label: 'SQL Relational', desc: 'Structured data, ACID compliance, transactions.', icon: Database },
        { value: 'NoSQL Document Store (MongoDB/DynamoDB)', label: 'NoSQL Document', desc: 'Flexible schema, high-write volume, quick scaling.', icon: Database },
        { value: 'Distributed SQL + Key-Value Cache (Redis)', label: 'Hybrid Database & Cache', desc: 'Maximum performance, caching, session store.', icon: Database },
      ],
      allowCustom: true,
      customPlaceholder: 'Or describe database (e.g. Cassandra for time-series)...',
    },
    {
      title: 'Communication Protocol',
      key: 'network',
      question: 'How do services communicate with each other?',
      options: [
        { value: 'REST APIs & Synchronous calls', label: 'Synchronous REST / GraphQL', desc: 'Simple, direct request-response pattern.', icon: Network },
        { value: 'Asynchronous Event Broker (RabbitMQ/Kafka)', label: 'Event-Driven Architecture', desc: 'Pub/Sub queues, decoupled microservices, worker pools.', icon: Network },
        { value: 'gRPC & Service Mesh', label: 'gRPC Microservices RPC', desc: 'High performance internal binary communication.', icon: Network },
      ],
    },
  ];

  const sequenceSteps: InterviewStep[] = [
    {
      title: 'Scenario',
      key: 'scenario',
      question: 'Which software scenario flow do we want to map?',
      options: [
        { value: 'User authentication with JWT and Multi-Factor Auth (MFA)', label: 'User Auth & MFA', desc: 'Register, verification, JWT token generation.', icon: Compass },
        { value: 'E-commerce Checkout & payment capture with Stripe/Razorpay', label: 'Checkout & Payment Capture', desc: 'Cart verification, checkout, webhooks, invoice.', icon: Compass },
        { value: 'User Profile image upload via pre-signed S3 URL', label: 'Secure S3 File Upload', desc: 'Token request, direct upload, database save.', icon: Compass },
        { value: 'OAuth 2.0 Authorization Code flow with External Identity Provider', label: 'OAuth 2.0 / SSO', desc: 'Redirect, code exchange, access token fetch.', icon: Compass },
      ],
      allowCustom: true,
      customPlaceholder: 'Or enter custom sequence scenario...',
    },
    {
      title: 'Participants',
      key: 'participants',
      question: 'Who are the core actors/services in this sequence?',
      options: [
        { value: 'User client, API Gateway, Auth service, Database', label: 'Standard Tier (Client + Gateway + Auth + DB)', desc: 'Standard backend system setup.', icon: Cpu },
        { value: 'User, Client WebApp, Payment Gateway, Payment Broker, Bank API', label: 'Third-Party Integration Tier', desc: 'External integrations with webhook validation.', icon: Cpu },
        { value: 'Mobile client, Load Balancer, Ingestion Worker, Redis, MongoDB', label: 'High Throughput Ingestion Tier', desc: 'Fast client upload with async worker queue.', icon: Cpu },
      ],
    },
    {
      title: 'State Verification',
      key: 'verification',
      question: 'Is database read or transaction logging needed in the flow?',
      options: [
        { value: 'Simple state updates with logs and cache invalidation', label: 'Logging & Caching', desc: 'Verify cache, hit database, update cache.', icon: Database },
        { value: 'Full database transaction write with rollback protection', label: 'ACID Database Write', desc: 'Multi-table locking/writes with validation check.', icon: Database },
        { value: 'Stateless read-only pass-through', label: 'Stateless Flow', desc: 'No database calls needed.', icon: Database },
      ],
    },
  ];

  const steps = isSequence ? sequenceSteps : flowchartSteps;
  const currentStepData = steps[currentStep];

  const handleOptionSelect = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentStepData.key]: val }));
    setCustomValue('');
  };

  const handleNext = () => {
    const chosenVal = answers[currentStepData.key] || customValue.trim();
    if (!chosenVal) {
      toast.error('Please choose or enter an answer before continuing.');
      return;
    }

    if (customValue.trim()) {
      setAnswers((prev) => ({ ...prev, [currentStepData.key]: customValue.trim() }));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCustomValue(answers[steps[currentStep + 1]?.key] || '');
    } else {
      handleGenerate();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setCustomValue('');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const finalAnswers = { ...answers };
    if (customValue.trim()) {
      finalAnswers[currentStepData.key] = customValue.trim();
    }

    let composedPrompt = '';
    if (isSequence) {
      composedPrompt = `Generate a detailed UML sequence diagram for a scenario of "${finalAnswers.scenario}". 
Actors & participants involved: ${finalAnswers.participants}.
Database action style: ${finalAnswers.verification}.
Please show clear lifelines, synchronous activations, and response returns.`;
    } else {
      composedPrompt = `Generate a comprehensive system architecture diagram for a "${finalAnswers.domain}".
Scale & architecture strategy: ${finalAnswers.scale}.
Data & Database tier: ${finalAnswers.database}.
Service-to-service communication: ${finalAnswers.network}.
Ensure nodes representing Load Balancers, API Gateways, Microservices, Databases, Caching tiers, and Queues are laid out beautifully.`;
    }

    try {
      const res = await aiAPI.generate({
        prompt: composedPrompt,
        diagramType: diagramType || 'flowchart',
      });

      const nextSyntax = res.data?.data?.syntax || res.data?.syntax;
      if (!nextSyntax) {
        throw new Error('AI returned an empty diagram syntax');
      }

      onGenerate(nextSyntax);
      toast.success('Architecture diagram generated!');
      onClose();
      // Reset wizard
      setCurrentStep(0);
      setAnswers({});
      setCustomValue('');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate diagram from interview. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeAnswer = answers[currentStepData.key] || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interactive System Interview" size="lg">
      <div className="flex flex-col min-h-0 max-h-[70vh] custom-scrollbar">
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 border-b border-white/[0.05] pb-4 mb-6">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
                  idx === currentStep
                    ? 'bg-white border-white text-[#09090b]'
                    : idx < currentStep
                    ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]'
                    : 'bg-white/[0.02] border-white/[0.05] text-[#52525b]'
                )}
              >
                {idx + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider hidden sm:inline truncate max-w-[80px]',
                  idx === currentStep ? 'text-white' : 'text-[#52525b]'
                )}
              >
                {step.title}
              </span>
              {idx < steps.length - 1 && <div className="h-px flex-1 bg-white/[0.05]" />}
            </div>
          ))}
        </div>

        {/* Wizard content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          <h3 className="text-[13px] font-semibold text-white">{currentStepData.question}</h3>

          <div className="grid grid-cols-1 gap-2">
            {currentStepData.options.map((opt) => {
              const isSelected = activeAnswer === opt.value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleOptionSelect(opt.value)}
                  className={cn(
                    'text-left p-4 rounded-xl border flex items-start gap-4 transition-all duration-150',
                    isSelected
                      ? 'border-white bg-white/[0.03]'
                      : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.02]'
                  )}
                >
                  {Icon && (
                    <div
                      className={cn(
                        'p-2 rounded-lg border shrink-0',
                        isSelected ? 'bg-white text-[#09090b] border-white' : 'bg-white/[0.04] border-white/[0.06] text-[#52525b]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <h5 className={cn('text-xs font-bold leading-none', isSelected ? 'text-white' : 'text-[#a1a1aa]')}>
                      {opt.label}
                    </h5>
                    {opt.desc && <p className="text-[11px] text-[#52525b] leading-normal">{opt.desc}</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {currentStepData.allowCustom && (
            <div className="pt-2 space-y-1.5">
              <span className="text-[9px] font-bold text-[#52525b] uppercase tracking-wider block">Custom Option</span>
              <input
                type="text"
                placeholder={currentStepData.customPlaceholder}
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[currentStepData.key];
                    return copy;
                  });
                }}
                className="w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
              />
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-6 shrink-0 bg-[#0a0a0d] -mx-6 -mb-5 px-6 pb-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white font-semibold hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#09090b] text-[11px] font-bold uppercase tracking-wider hover:bg-[#e4e4e7] disabled:opacity-40 transition-all shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                Generate Diagram <Sparkles className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
