import React, { useMemo } from 'react';
import { parseSyntaxToGraph } from '@/domain/diagramParser';

interface ThumbnailNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ThumbnailEdge {
  from: string;
  to: string;
}

export interface DiagramThumbnailProps {
  nodes?: any[];
  edges?: any[];
  syntax?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const DiagramThumbnail = React.memo(function DiagramThumbnail({
  nodes,
  edges,
  syntax,
  width = 240,
  height = 110,
  className = '',
}: DiagramThumbnailProps) {
  const { previewNodes, previewEdges } = useMemo(() => {
    let rawNodes: any[] = Array.isArray(nodes) && nodes.length > 0 ? nodes : [];
    let rawEdges: any[] = Array.isArray(edges) && edges.length > 0 ? edges : [];

    // Fall back to syntax if nodes array is empty
    if (rawNodes.length === 0 && syntax && syntax.trim().length > 0) {
      try {
        const parsed = parseSyntaxToGraph(syntax);
        rawNodes = parsed.nodes;
        rawEdges = parsed.edges;
      } catch {
        // syntax parsing failure fallback
      }
    }

    if (rawNodes.length === 0) {
      return { previewNodes: [], previewEdges: [] };
    }

    // Limit to 20 nodes for fast bounding and rendering
    const cappedNodes = rawNodes.slice(0, 20);
    const validIds = new Set(cappedNodes.map((n) => String(n.id)));

    const mappedNodes: ThumbnailNode[] = cappedNodes.map((n, idx) => {
      const x = typeof n.position?.x === 'number' && Number.isFinite(n.position.x) ? n.position.x : (idx % 4) * 140;
      const y = typeof n.position?.y === 'number' && Number.isFinite(n.position.y) ? n.position.y : Math.floor(idx / 4) * 80;
      const label = typeof n.data?.label === 'string' ? n.data.label : String(n.id || `Node ${idx + 1}`);
      return {
        id: String(n.id),
        label,
        x,
        y,
        width: typeof n.width === 'number' ? n.width : 100,
        height: typeof n.height === 'number' ? n.height : 36,
      };
    });

    const mappedEdges: ThumbnailEdge[] = rawEdges
      .filter((e) => validIds.has(String(e.source)) && validIds.has(String(e.target)))
      .slice(0, 25)
      .map((e) => ({ from: String(e.source), to: String(e.target) }));

    // Bounding Box Calculation
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    mappedNodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y < minY) minY = n.y;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    const graphW = Math.max(1, maxX - minX);
    const graphH = Math.max(1, maxY - minY);

    const padding = 16;
    const availW = width - padding * 2;
    const availH = height - padding * 2;

    const scale = Math.min(availW / graphW, availH / graphH, 0.9);
    const offsetX = padding + (availW - graphW * scale) / 2;
    const offsetY = padding + (availH - graphH * scale) / 2;

    const scaledNodes = mappedNodes.map((n) => ({
      ...n,
      x: offsetX + (n.x - minX) * scale,
      y: offsetY + (n.y - minY) * scale,
      width: Math.max(20, n.width * scale),
      height: Math.max(12, n.height * scale),
    }));

    return { previewNodes: scaledNodes, previewEdges: mappedEdges };
  }, [nodes, edges, syntax, width, height]);

  if (previewNodes.length === 0) {
    return (
      <div
        style={{ width: '100%', height: `${height}px` }}
        className={`flex flex-col items-center justify-center rounded-lg bg-[#09090b] border border-white/[0.04] text-zinc-600 ${className}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-1 opacity-50">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
          <path d="M9 9h6v6H9z" />
        </svg>
        <span className="text-[10px] font-mono">Empty Diagram</span>
      </div>
    );
  }

  const nodeMap = new Map(previewNodes.map((n) => [n.id, n]));

  return (
    <div
      style={{ width: '100%', height: `${height}px` }}
      className={`relative overflow-hidden rounded-lg bg-[#09090b] border border-white/[0.05] ${className}`}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Background Subtle Grid */}
        <defs>
          <pattern id="thumb-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#27272a" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#thumb-grid)" />

        {/* Edges */}
        {previewEdges.map((e, idx) => {
          const src = nodeMap.get(e.from);
          const tgt = nodeMap.get(e.to);
          if (!src || !tgt) return null;
          const x1 = src.x + src.width / 2;
          const y1 = src.y + src.height / 2;
          const x2 = tgt.x + tgt.width / 2;
          const y2 = tgt.y + tgt.height / 2;
          return (
            <line
              key={`edge-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3f3f46"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          );
        })}

        {/* Nodes */}
        {previewNodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="3"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1"
            />
            {node.width > 30 && (
              <text
                x={node.x + node.width / 2}
                y={node.y + node.height / 2 + 3}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize={Math.min(8, Math.max(5, node.height * 0.5))}
                fontFamily="system-ui, sans-serif"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {node.label.length > 10 ? `${node.label.slice(0, 9)}…` : node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
});
