import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  GitBranch,
  Search,
  Layout,
  Globe,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';
import { useDiagramStore } from '@/stores/diagramStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { AIComposer } from '@/components/dashboard/AIComposer';
import { RecentDiagramCard } from '@/components/dashboard/RecentDiagramCard';
import { CANONICAL_TEMPLATES } from '@/domain/templates';

const TEMPLATES = Object.values(CANONICAL_TEMPLATES).slice(0, 4);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { diagrams, fetchDiagrams, isLoading } = useDiagramStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchDiagrams({ workspaceId: currentWorkspace.id });
    }
  }, [currentWorkspace?.id, fetchDiagrams]);

  const handleRefresh = async () => {
    if (!currentWorkspace?.id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchDiagrams({ workspaceId: currentWorkspace.id });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeDiagrams = diagrams.filter((d) => !d.trashed);

  const queryClean = searchQuery.trim().toLowerCase();
  const filteredDiagrams = activeDiagrams.filter((d) => {
    if (!queryClean) return true;
    const titleMatch = (d.title || '').toLowerCase().includes(queryClean);
    const typeMatch = (d.type || '').toLowerCase().includes(queryClean);
    const syntaxMatch = (d.syntax || '').toLowerCase().includes(queryClean);
    return titleMatch || typeMatch || syntaxMatch;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Engineer';

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-10 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Design, explore, and refine your system architecture workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-white/[0.08] bg-[#0d0d10] text-zinc-400 hover:text-white transition-colors"
            aria-label="Refresh diagrams"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <Link
            to="/diagram/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagram</span>
          </Link>
        </div>
      </div>

      {/* Prominent AI Prompt Composer */}
      <AIComposer />

      {/* Recent Diagrams Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Recent Architecture Diagrams</h2>
            <span className="text-xs font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              {filteredDiagrams.length}
            </span>
          </div>

          {/* Search Filter Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, type, or component..."
              className="w-full bg-[#0d0d10] border border-white/[0.08] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0d0d10] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : filteredDiagrams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiagrams.map((d) => (
              <RecentDiagramCard key={d.id} diagram={d} />
            ))}
          </div>
        ) : searchQuery ? (
          /* Search Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-10 text-center space-y-3">
            <p className="text-sm text-zinc-400">
              No diagrams found matching <span className="text-white font-medium">"{searchQuery}"</span>
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Workspace Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Architecture Workspace is Empty</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Start by typing an architecture prompt above or choose a pre-validated system pattern below.
            </p>
            <div className="pt-2">
              <Link
                to="/diagram/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Blank Diagram</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div className="space-y-4 border-t border-white/[0.08] pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Architecture Templates</h2>
            <p className="text-xs text-zinc-400">Pre-validated system design patterns to kickstart your work</p>
          </div>
          <Link
            to="/templates"
            className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <span>View All Templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-xl border border-white/[0.08] bg-[#0d0d10] p-4 space-y-2.5 hover:border-white/[0.18] transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {t.type}
                </span>
                <h3 className="text-sm font-bold text-white mt-2">{t.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{t.description}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/diagram/new?template=${t.id}`)}
                className="w-full mt-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white transition-all text-center"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
