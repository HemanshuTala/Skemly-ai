import React from 'react';
import { MousePointer2, Hand, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactFlowInstance } from 'reactflow';

export interface CanvasFloatingToolbarProps {
  interactionMode: 'select' | 'pan';
  setInteractionMode: (mode: 'select' | 'pan') => void;
  zoom: number;
  reactFlowInstance: ReactFlowInstance | null;
  toolbarRef?: React.Ref<HTMLDivElement>;
}

export const CanvasFloatingToolbar = React.memo(function CanvasFloatingToolbar({
  interactionMode,
  setInteractionMode,
  zoom,
  reactFlowInstance,
  toolbarRef,
}: CanvasFloatingToolbarProps) {
  return (
    <div
      ref={toolbarRef}
      className="export-ignore absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Tool Picker */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#0d0d10]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
        <button
          type="button"
          onClick={() => setInteractionMode('select')}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            interactionMode === 'select'
              ? 'bg-white/[0.14] text-white border border-white/[0.18] shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
          )}
          title="Select Tool (V)"
          aria-label="Select Tool"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setInteractionMode('pan')}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            interactionMode === 'pan'
              ? 'bg-white/[0.14] text-white border border-white/[0.18] shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
          )}
          title="Pan Tool (H)"
          aria-label="Pan Tool"
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom & View Controls */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#0d0d10]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
        <button
          type="button"
          onClick={() => reactFlowInstance?.zoomOut()}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-3 text-[11px] font-semibold tabular-nums text-white min-w-[3.5rem] text-center tracking-tighter">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          onClick={() => reactFlowInstance?.zoomIn()}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-white/[0.08] mx-1" />
        <button
          type="button"
          onClick={() => reactFlowInstance?.fitView({ duration: 800 })}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Fit View"
          aria-label="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
