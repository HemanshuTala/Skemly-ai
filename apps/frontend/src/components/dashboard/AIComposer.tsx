import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { aiAPI } from '@/services/api.service';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDiagramStore } from '@/stores/diagramStore';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
  'Design a scalable e-commerce microservice architecture with API Gateway, Order Service, and Redis Cache',
  'Create a real-time notification system using WebSockets, Kafka, and DynamoDB',
  'Build a secure auth system with OAuth2, JWT validation, and PostgreSQL database',
  'Design an event-driven payment processing pipeline with SQS queues and Stripe webhooks',
];

export function AIComposer() {
  const [promptText, setPromptText] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = promptText.trim();
    if (!query || status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage(null);
    setSubmittingStep('Generating architecture with AI...');

    try {
      // 1. Get or fetch active workspace
      let workspace = useWorkspaceStore.getState().currentWorkspace;
      if (!workspace) {
        await useWorkspaceStore.getState().fetchWorkspaces();
        workspace = useWorkspaceStore.getState().currentWorkspace;
      }
      const workspaceId = workspace?.id || 'default';

      // 2. Call AI Generation endpoint
      setSubmittingStep('Compiling architecture into Diagram IR...');
      const aiRes = await aiAPI.generate({
        prompt: query,
        diagramType: 'flowchart',
      });

      const generatedSyntax = aiRes.data?.data?.syntax || '';

      // 3. Derive a clean title from the prompt
      const titleWords = query.split(/\s+/).slice(0, 6).join(' ');
      const cleanTitle = titleWords.length > 0 ? titleWords : 'AI Generated Architecture';

      // 4. Create the real diagram in backend
      setSubmittingStep('Creating workspace diagram...');
      const newDiagram = await useDiagramStore.getState().createDiagram({
        title: cleanTitle,
        type: 'flowchart',
        workspaceId,
        syntax: generatedSyntax,
      });

      setStatus('idle');
      navigate(`/diagram/${newDiagram.id}`);
    } catch (err: any) {
      console.error('AI Composer error:', err);
      setStatus('error');
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'AI generation failed. Your prompt is preserved.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
    setSubmittingStep('');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-[#0d0d10] to-[#0d0d10] p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">AI ARCHITECTURE COPILOT</span>
        </div>

        {status === 'submitting' && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">What architecture do you want to build?</h2>
      <p className="text-xs sm:text-sm text-zinc-400 mb-6">
        Describe your cloud system, microservices, or data flows in natural language. Schemely AI compiles it into deterministic Diagram IR.
      </p>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="relative rounded-xl border border-white/[0.1] bg-[#09090b] p-3 focus-within:border-purple-500/50 transition-colors shadow-inner">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={status === 'submitting'}
            placeholder="e.g. Design a high-throughput video streaming service with CloudFront CDN, Transcoder Workers, S3 storage, and Redis metadata cache..."
            rows={3}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 resize-none focus:outline-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleGenerate(e);
              }
            }}
          />
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] font-mono text-zinc-500">
              {status === 'submitting' ? (
                <span className="flex items-center gap-2 text-purple-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {submittingStep}
                </span>
              ) : (
                'Press Ctrl + Enter to generate'
              )}
            </span>

            <button
              type="submit"
              disabled={!promptText.trim() || status === 'submitting'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-lg shadow-purple-600/20"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Generate Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification with Retry */}
        {status === 'error' && errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium shrink-0 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">PROMPT TEMPLATES</span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                disabled={status === 'submitting'}
                onClick={() => setPromptText(s)}
                className="text-left text-xs text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-all truncate max-w-full disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
