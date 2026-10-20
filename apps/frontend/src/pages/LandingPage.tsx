import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu, Globe, Database, Shield, Layers, Layout, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import SkemlyLogo from '../assets/Skemly.png';
import { ArchitecturePreview, SAMPLE_ARCHITECTURES } from '../components/landing/ArchitecturePreview';
import { ArchitecturePipeline } from '../components/landing/ArchitecturePipeline';
import { ExampleArchitecture } from '../components/landing/ExampleArchitecture';
import { useAuthStore } from '@/stores/authStore';

const FEATURES = [
  { icon: Sparkles, title: 'AI Generation', desc: 'Describe your system architecture in plain English. Schemely AI compiles it into structured Diagram IR.' },
  { icon: Cpu, title: 'Architecture Critic', desc: 'Automated evaluation engine detects direct Client-to-DB connections, unconsumed queues, and circular call loops.' },
  { icon: Layers, title: 'Incremental AI Refinement', desc: 'Modify existing architectures incrementally without losing manual node positions or custom styling.' },
  { icon: Layout, title: 'Deterministic Layouts', desc: 'Cycle-safe symmetric auto-layout engine reduces edge crossings and maintains collision-free spacing.' },
];

const USE_CASES = [
  { icon: Cpu, label: 'System Design Interviews' },
  { icon: Globe, label: 'Cloud Infrastructure' },
  { icon: Database, label: 'Data Processing Pipelines' },
  { icon: Shield, label: 'Security & Auth Flows' },
  { icon: Layers, label: 'Microservices Architecture' },
  { icon: Layout, label: 'API Gateway Routing' },
];

export default function LandingPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-purple-500/20 selection:text-purple-300">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={SkemlyLogo} alt="Schemely AI" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-white">Schemely AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
            <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
                >
                  <span>Try Schemely AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-NATIVE SYSTEM DESIGN IDE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Design systems with AI, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">not just diagrams.</span>
            </h1>

            <p className="text-base text-zinc-400 leading-relaxed max-w-xl">
              Describe cloud architectures, microservices, or data flows in natural language. Schemely AI compiles it into deterministic Diagram IR, validates connections, and lets you refine visually without losing manual edits.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white shadow-xl shadow-purple-600/25 transition-all"
              >
                <span>Create Your First Diagram</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#examples"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-semibold text-zinc-300 hover:text-white transition-all"
              >
                <span>Explore Examples</span>
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Deterministic IR</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Vector Exports</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Offline IndexedDB</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <ArchitecturePreview data={SAMPLE_ARCHITECTURES.ecommerce} />
          </div>
        </div>
      </section>

      {/* Engine Pipeline Section */}
      <section id="pipeline" className="py-20 px-6 max-w-[1200px] mx-auto border-t border-white/[0.06]">
        <ArchitecturePipeline />
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 px-6 max-w-[1200px] mx-auto border-t border-white/[0.06]">
        <div className="mb-12">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">ENGINEERING CAPABILITIES</span>
          <h2 className="text-3xl font-bold text-white mt-1">Built for Serious Architecture Engineering</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-6 space-y-3 hover:border-purple-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Examples */}
      <section id="examples" className="py-20 px-6 max-w-[1200px] mx-auto border-t border-white/[0.06]">
        <ExampleArchitecture />
      </section>

      {/* Use Cases Grid */}
      <section id="use-cases" className="py-20 px-6 max-w-[1200px] mx-auto border-t border-white/[0.06]">
        <div className="mb-12">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">USE CASES</span>
          <h2 className="text-3xl font-bold text-white mt-1">Architectural Patterns Across Engineering Domains</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <div key={idx} className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/[0.08] bg-[#0d0d10] text-center hover:border-white/[0.16] transition-all">
                <Icon className="w-6 h-6 text-purple-400 mb-2" />
                <span className="text-xs font-medium text-zinc-300">{uc.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/[0.06]">
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#0d0d10] to-[#0d0d10] p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Design your next system with Schemely AI.</h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Turn natural language prompts into verified, structured system design artifacts in seconds.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white shadow-xl shadow-purple-600/30 transition-all"
            >
              <span>Start Designing Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12 px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={SkemlyLogo} alt="Schemely AI" className="w-6 h-6 rounded-md" />
            <span className="font-sans font-bold text-zinc-300 text-sm">Schemely AI</span>
          </div>
          <div>© {new Date().getFullYear()} Schemely AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
