import React from 'react';
import { motion } from 'framer-motion';

export interface ArchitectureNode {
  id: string;
  label: string;
  type: 'client' | 'gateway' | 'service' | 'database' | 'queue' | 'cache';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
}

export interface ArchitectureData {
  title: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

const TYPE_STYLES: Record<string, { fill: string; border: string; text: string; icon: string }> = {
  client:   { fill: '#18181b', border: '#27272a', text: '#38bdf8', icon: '💻' },
  gateway:  { fill: '#18181b', border: '#3f3f46', text: '#a855f7', icon: '⚡' },
  service:  { fill: '#18181b', border: '#27272a', text: '#f4f4f5', icon: '⚙️' },
  database: { fill: '#18181b', border: '#334155', text: '#4ade80', icon: '🛢️' },
  queue:    { fill: '#18181b', border: '#451a03', text: '#fb923c', icon: '📥' },
  cache:    { fill: '#18181b', border: '#371b26', text: '#f43f5e', icon: '⚡' },
};

export const SAMPLE_ARCHITECTURES: Record<string, ArchitectureData> = {
  ecommerce: {
    title: 'E-Commerce Microservices',
    nodes: [
      { id: 'web', label: 'Web / Mobile Client', type: 'client', x: 40, y: 110, width: 140, height: 44 },
      { id: 'gw', label: 'API Gateway', type: 'gateway', x: 220, y: 110, width: 130, height: 44 },
      { id: 'auth', label: 'Auth Service', type: 'service', x: 400, y: 40, width: 130, height: 44 },
      { id: 'order', label: 'Order Service', type: 'service', x: 400, y: 110, width: 130, height: 44 },
      { id: 'pay', label: 'Payment Service', type: 'service', x: 400, y: 180, width: 130, height: 44 },
      { id: 'db', label: 'PostgreSQL DB', type: 'database', x: 580, y: 75, width: 130, height: 44 },
      { id: 'redis', label: 'Redis Cache', type: 'cache', x: 580, y: 145, width: 130, height: 44 },
    ],
    edges: [
      { from: 'web', to: 'gw', label: 'HTTPS', animated: true },
      { from: 'gw', to: 'auth', label: 'JWT' },
      { from: 'gw', to: 'order', label: 'gRPC', animated: true },
      { from: 'gw', to: 'pay', label: 'REST' },
      { from: 'order', to: 'db', label: 'SQL' },
      { from: 'order', to: 'redis', label: 'Cache' },
    ],
  },
  chat: {
    title: 'Real-Time Chat System',
    nodes: [
      { id: 'client', label: 'Mobile Client', type: 'client', x: 40, y: 100, width: 130, height: 44 },
      { id: 'ws', label: 'WebSocket Server', type: 'gateway', x: 220, y: 100, width: 140, height: 44 },
      { id: 'kafka', label: 'Kafka Event Bus', type: 'queue', x: 410, y: 100, width: 140, height: 44 },
      { id: 'worker', label: 'Message Worker', type: 'service', x: 590, y: 50, width: 130, height: 44 },
      { id: 'mongo', label: 'MongoDB Store', type: 'database', x: 590, y: 140, width: 130, height: 44 },
    ],
    edges: [
      { from: 'client', to: 'ws', label: 'WSS', animated: true },
      { from: 'ws', to: 'kafka', label: 'Publish', animated: true },
      { from: 'kafka', to: 'worker', label: 'Consume' },
      { from: 'worker', to: 'mongo', label: 'Write' },
    ],
  },
  urlShortener: {
    title: 'URL Shortener Architecture',
    nodes: [
      { id: 'user', label: 'User Browser', type: 'client', x: 40, y: 90, width: 130, height: 44 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', x: 210, y: 90, width: 130, height: 44 },
      { id: 'app', label: 'Redirect Service', type: 'service', x: 380, y: 90, width: 140, height: 44 },
      { id: 'cache', label: 'Redis Key Store', type: 'cache', x: 560, y: 40, width: 130, height: 44 },
      { id: 'db', label: 'Postgres DB', type: 'database', x: 560, y: 140, width: 130, height: 44 },
    ],
    edges: [
      { from: 'user', to: 'lb', label: 'GET /:hash', animated: true },
      { from: 'lb', to: 'app', label: 'Proxy' },
      { from: 'app', to: 'cache', label: '1. Lookup' },
      { from: 'app', to: 'db', label: '2. Fallback' },
    ],
  },
};

export function ArchitecturePreview({
  data = SAMPLE_ARCHITECTURES.ecommerce,
  className = '',
}: {
  data?: ArchitectureData;
  className?: string;
}) {
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090b] p-6 shadow-2xl ${className}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-zinc-300">{data.title}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">VALIDATED</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">98% QUALITY</span>
        </div>
      </div>

      {/* SVG Connections & Nodes */}
      <div className="relative w-full h-[220px] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
            </marker>
          </defs>
          {data.edges.map((edge, idx) => {
            const src = nodeMap.get(edge.from);
            const tgt = nodeMap.get(edge.to);
            if (!src || !tgt) return null;

            const x1 = src.x + (src.width || 130);
            const y1 = src.y + (src.height || 44) / 2;
            const x2 = tgt.x;
            const y2 = tgt.y + (tgt.height || 44) / 2;
            const midX = (x1 + x2) / 2;

            const pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            return (
              <g key={idx}>
                <path d={pathD} fill="none" stroke="#27272a" strokeWidth="2" markerEnd="url(#arrow)" />
                {edge.animated && (
                  <motion.circle
                    r="3.5"
                    fill="#38bdf8"
                    initial={{ offsetDistance: '0%' }}
                    animate={{ offsetDistance: '100%' }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    style={{ offsetPath: `path("${pathD}")` }}
                  />
                )}
                {edge.label && (
                  <text x={midX} y={(y1 + y2) / 2 - 6} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {data.nodes.map((node) => {
          const cfg = TYPE_STYLES[node.type] || TYPE_STYLES.service;
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width || 130}px`,
                height: `${node.height || 44}px`,
                backgroundColor: cfg.fill,
                borderColor: cfg.border,
              }}
              className="flex items-center gap-2 px-3 rounded-lg border shadow-lg cursor-pointer hover:border-zinc-400 transition-colors"
            >
              <span className="text-sm">{cfg.icon}</span>
              <span className="text-xs font-medium text-zinc-200 truncate">{node.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
