import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArchitecturePreview, SAMPLE_ARCHITECTURES } from './ArchitecturePreview';
import { ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const EXAMPLES = [
  { id: 'ecommerce', label: 'E-Commerce Microservices', desc: 'API Gateway, Auth, Order, Payment, PostgreSQL, Redis' },
  { id: 'chat', label: 'Real-Time Chat', desc: 'WebSocket Server, Kafka Event Bus, Message Workers, MongoDB' },
  { id: 'urlShortener', label: 'URL Shortener', desc: 'Load Balancer, Redirect Service, Redis Key Cache, Postgres Fallback' },
];

export function ExampleArchitecture() {
  const [selectedKey, setSelectedKey] = useState<string>('ecommerce');
  const currentData = SAMPLE_ARCHITECTURES[selectedKey] || SAMPLE_ARCHITECTURES.ecommerce;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">INTERACTIVE EXAMPLES</span>
          <h2 className="text-3xl font-bold text-white mt-1">Explore Pre-Built Architecture Patterns</h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/diagram/new?template=${selectedKey}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open This Pattern</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/diagram/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-white hover:bg-white/[0.1] transition-all"
          >
            <span>Start Blank</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedKey(ex.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
              selectedKey === ex.id
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-inner'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Preview Component */}
      <div className="relative">
        <ArchitecturePreview data={currentData} />
      </div>
    </div>
  );
}
