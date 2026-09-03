import React from 'react';
import { Node } from 'reactflow';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNodeStyle } from '../nodes/FlowchartNode';

export interface QuickAddOverlayProps {
  node: Node | undefined;
  zoom: number;
  viewport: { x: number; y: number };
  onAdd: (dir: 'top' | 'right' | 'bottom' | 'left') => void;
}

export const QuickAddOverlay = React.memo(function QuickAddOverlay({
  node,
  zoom,
  viewport,
  onAdd,
}: QuickAddOverlayProps) {
  if (!node?.data) return null;
  const style = getNodeStyle(node.data, (node.data as any)?.kind || 'node');
  const w = style.width * zoom;
  const h = style.height * zoom;
  const tx = node.position.x * zoom + viewport.x;
  const ty = node.position.y * zoom + viewport.y;

  const btnClass =
    'absolute flex items-center justify-center w-5 h-5 rounded-full bg-white text-zinc-950 border border-zinc-200 shadow-lg hover:scale-125 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer z-[60]';

  return (
    <div
      className="absolute pointer-events-none z-[50]"
      style={{ left: tx, top: ty, width: w, height: h }}
    >
      {/* Top */}
      <button
        type="button"
        className={cn(btnClass, 'pointer-events-auto -top-6 left-1/2 -translate-x-1/2')}
        onClick={(e) => {
          e.stopPropagation();
          onAdd('top');
        }}
        aria-label="Add connected node above"
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Right */}
      <button
        type="button"
        className={cn(btnClass, 'pointer-events-auto -right-6 top-1/2 -translate-y-1/2')}
        onClick={(e) => {
          e.stopPropagation();
          onAdd('right');
        }}
        aria-label="Add connected node right"
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Bottom */}
      <button
        type="button"
        className={cn(btnClass, 'pointer-events-auto -bottom-6 left-1/2 -translate-x-1/2')}
        onClick={(e) => {
          e.stopPropagation();
          onAdd('bottom');
        }}
        aria-label="Add connected node below"
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Left */}
      <button
        type="button"
        className={cn(btnClass, 'pointer-events-auto -left-6 top-1/2 -translate-y-1/2')}
        onClick={(e) => {
          e.stopPropagation();
          onAdd('left');
        }}
        aria-label="Add connected node left"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
});
