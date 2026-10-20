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
      { id: 'web', label: 'Web / Mobile Client', type: 'client', x: 12, y: 110, width: 136, height: 46 },
      { id: 'gw', label: 'API Gateway', type: 'gateway', x: 166, y: 110, width: 128, height: 46 },
      { id: 'auth', label: 'Auth Service', type: 'service', x: 326, y: 40, width: 128, height: 46 },
      { id: 'order', label: 'Order Service', type: 'service', x: 326, y: 110, width: 128, height: 46 },
      { id: 'pay', label: 'Payment Service', type: 'service', x: 326, y: 180, width: 128, height: 46 },
      { id: 'db', label: 'PostgreSQL DB', type: 'database', x: 490, y: 75, width: 128, height: 46 },
      { id: 'redis', label: 'Redis Cache', type: 'cache', x: 490, y: 145, width: 128, height: 46 },
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
      { id: 'client', label: 'Mobile Client', type: 'client', x: 12, y: 100, width: 128, height: 46 },
      { id: 'ws', label: 'WebSocket Server', type: 'gateway', x: 164, y: 100, width: 136, height: 46 },
      { id: 'kafka', label: 'Kafka Event Bus', type: 'queue', x: 324, y: 100, width: 136, height: 46 },
      { id: 'worker', label: 'Message Worker', type: 'service', x: 488, y: 48, width: 130, height: 46 },
      { id: 'mongo', label: 'MongoDB Store', type: 'database', x: 488, y: 152, width: 130, height: 46 },
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
      { id: 'user', label: 'User Browser', type: 'client', x: 12, y: 90, width: 128, height: 46 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', x: 164, y: 90, width: 128, height: 46 },
      { id: 'app', label: 'Redirect Service', type: 'service', x: 316, y: 90, width: 136, height: 46 },
      { id: 'cache', label: 'Redis Key Store', type: 'cache', x: 480, y: 40, width: 138, height: 46 },
      { id: 'db', label: 'Postgres DB', type: 'database', x: 480, y: 140, width: 138, height: 46 },
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
  const markerId = `arrow-${React.useId().replace(/:/g, '')}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0c10] p-4 shadow-2xl shadow-black/40 sm:p-5 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.12),transparent_58%)]" />
      {/* Top Header Bar */}
      <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3 sm:mb-4 sm:pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-400/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
          </div>
          <span className="truncate text-xs font-medium text-zinc-200 sm:text-sm">{data.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-wide sm:text-[10px]">
          <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1 text-emerald-300">VALIDATED</span>
          <span className="rounded-md border border-violet-400/15 bg-violet-400/[0.07] px-2 py-1 text-violet-300">98% QUALITY</span>
        </div>
      </div>

      {/* SVG Connections & Nodes */}
      <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.04] bg-[#09090c]">
        <svg
          className="relative block h-auto w-full"
          viewBox="0 0 630 260"
          role="img"
          aria-label={`${data.title} architecture diagram`}
        >
          <defs>
            <pattern id={`${markerId}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#27272a" />
            </pattern>
            <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
            </marker>
          </defs>
          <rect width="630" height="260" fill={`url(#${markerId}-grid)`} />
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
                <path d={pathD} fill="none" stroke="#3f3f46" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
                {edge.animated && (
                  <circle r="3" fill="#a78bfa">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path={pathD}
                    />
                  </circle>
                )}
              </g>
            );
          })}
          {data.nodes.map((node, index) => {
            const cfg = TYPE_STYLES[node.type] || TYPE_STYLES.service;
            const width = node.width || 130;
            const height = node.height || 46;
            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.035 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                <rect x={node.x} y={node.y} width={width} height={height} rx="9" fill="#15151b" stroke={cfg.border} strokeWidth="1.2" />
                <text x={node.x + 12} y={node.y + height / 2 + 5} fontSize="13" textAnchor="start">
                  {cfg.icon}
                </text>
                <text
                  x={node.x + 33}
                  y={node.y + height / 2 + 4}
                  fill="#e4e4e7"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Inter, sans-serif"
                >
                  {node.label}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
