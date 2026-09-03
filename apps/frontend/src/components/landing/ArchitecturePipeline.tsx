import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Cpu, Layout, CheckCircle2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'prompt', label: '1. Prompt Intent', icon: Sparkles, color: 'text-purple-400', desc: 'Classifies prompt into CREATE, MODIFY, or read-only EXPLAIN/CRITIQUE intent.' },
  { id: 'ir', label: '2. Structured IR', icon: Cpu, color: 'text-blue-400', desc: 'Translates prompt tokens into canonical Diagram IR nodes, edges, and relationships.' },
  { id: 'validation', label: '3. Rule Validation', icon: ShieldCheck, color: 'text-emerald-400', desc: 'Verifies graph integrity, deduplicates node IDs deterministically, and strips broken tokens.' },
  { id: 'repair', label: '4. Bounded Repair', icon: RefreshCw, color: 'text-amber-400', desc: 'Auto-repairs malformed syntax in max 3 iterations without resetting manual work.' },
  { id: 'layout', label: '5. Auto Layout', icon: Layout, color: 'text-cyan-400', desc: 'Symmetric column positioning and barycenter edge crossing reduction.' },
  { id: 'critic', label: '6. Architecture Critic', icon: Layers, color: 'text-rose-400', desc: 'Detects direct client-to-DB connections, unconsumed queues, and circular call loops.' },
];

export function ArchitecturePipeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/[0.06] pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">ENGINE PIPELINE</span>
          <h3 className="text-2xl font-bold text-white mt-1">Deterministic Architecture Compiler</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            Max 3 Repair Iterations
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            0% Token Explosion
          </span>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <Icon className={`w-5 h-5 ${step.color}`} />
                {isActive && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
              </div>
              <span className="text-xs font-semibold text-zinc-200">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Detail Box */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl border border-white/[0.08] bg-[#09090b] p-6 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-400 font-semibold">STAGE {activeStep + 1} OF 6</span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-sm font-semibold text-white">{PIPELINE_STEPS[activeStep].label}</span>
          </div>
          <p className="text-sm text-zinc-400 max-w-xl">{PIPELINE_STEPS[activeStep].desc}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
          >
            ← Previous
          </button>
          <button
            disabled={activeStep === PIPELINE_STEPS.length - 1}
            onClick={() => setActiveStep((prev) => Math.min(PIPELINE_STEPS.length - 1, prev + 1))}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-30"
          >
            Next Stage →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
