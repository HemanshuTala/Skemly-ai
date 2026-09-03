import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, MoreHorizontal, ChevronRight, GitBranch, Activity, Boxes, Layout, Globe, FileText, Trash2, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDiagramStore } from '@/stores/diagramStore';
import { DiagramThumbnail } from './DiagramThumbnail';

export interface DiagramCardData {
  id: string;
  title: string;
  type?: string;
  updatedAt: string;
  starred?: boolean;
  nodes?: any[];
  edges?: any[];
  syntax?: string;
  nodesCount?: number;
  projectId?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  flowchart: GitBranch,
  sequence: Activity,
  mindmap: Boxes,
  erd: Layout,
  network: Globe,
};

export function RecentDiagramCard({ diagram }: { diagram: DiagramCardData }) {
  const { starDiagram, unstarDiagram, duplicateDiagram, deleteDiagram } = useDiagramStore();
  const [isStarring, setIsStarring] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const Icon = TYPE_ICONS[diagram.type || 'flowchart'] || FileText;

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isStarring) return;
    setIsStarring(true);
    try {
      if (diagram.starred) {
        await unstarDiagram(diagram.id);
      } else {
        await starDiagram(diagram.id);
      }
    } finally {
      setIsStarring(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    await duplicateDiagram(diagram.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm(`Are you sure you want to delete "${diagram.title}"?`)) {
      await deleteDiagram(diagram.id);
    }
  };

  const nodeCount = diagram.nodes?.length ?? diagram.nodesCount ?? 0;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="relative">
      <Link to={`/diagram/${diagram.id}`} className="block">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d10] p-4 hover:border-white/[0.18] hover:shadow-xl hover:shadow-black/50 transition-all flex flex-col justify-between h-full">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {diagram.type || 'flowchart'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleStar}
                disabled={isStarring}
                className="p-1 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-amber-400 transition-colors"
                aria-label={diagram.starred ? 'Remove star' : 'Star diagram'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${diagram.starred ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'}`}
                />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  className="p-1 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                  aria-label="Diagram actions"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {showMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-white/[0.1] bg-[#18181b] p-1 shadow-xl z-20 text-xs text-zinc-300"
                  >
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] text-left"
                    >
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rose-500/20 text-rose-400 text-left"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SVG Diagram Preview */}
          <div className="mb-3">
            <DiagramThumbnail
              nodes={diagram.nodes}
              edges={diagram.edges}
              syntax={diagram.syntax}
              height={96}
            />
          </div>

          {/* Title & Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
              {diagram.title}
            </h3>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.06] text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(diagram.updatedAt), { addSuffix: true })}</span>
              </div>
              {nodeCount > 0 && <span>{nodeCount} nodes</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
