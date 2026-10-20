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
      className="export-ignore absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Tool Picker */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111115]/95 border border-white/[0.09] backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={() => setInteractionMode('select')}
          className={cn(
            'p-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
            interactionMode === 'select'
              ? 'bg-violet-400/15 text-violet-100 border border-violet-300/25 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
          )}
          title="Select Tool (V)"
          aria-label="Select Tool"
          aria-pressed={interactionMode === 'select'}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setInteractionMode('pan')}
          className={cn(
            'p-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
            interactionMode === 'pan'
              ? 'bg-violet-400/15 text-violet-100 border border-violet-300/25 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
          )}
          title="Pan Tool (H)"
          aria-label="Pan Tool"
          aria-pressed={interactionMode === 'pan'}
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom & View Controls */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111115]/95 border border-white/[0.09] backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={() => reactFlowInstance?.zoomOut()}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
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
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-white/[0.08] mx-1" />
        <button
          type="button"
          onClick={() => reactFlowInstance?.fitView({ duration: 800 })}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          title="Fit View"
          aria-label="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
