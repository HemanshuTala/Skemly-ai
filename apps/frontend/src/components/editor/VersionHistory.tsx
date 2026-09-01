import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  X,
  RotateCcw,
  Clock,
  User,
  Check,
  ChevronRight,
  ChevronDown,
  Eye,
  Diff,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Version {
  id: string;
  versionNumber: number;
  timestamp: Date;
  author: {
    name: string;
    avatar?: string;
  };
  message: string;
  code: string;
  changes?: {
    added: number;
    removed: number;
  };
  isAutoSave?: boolean;
  tags?: string[];
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  currentVersionId?: string;
  onRestore: (version: Version) => void;
  onCompare?: (v1: Version, v2: Version) => void;
  onDelete?: (versionId: string) => void;
  currentCode: string;
}

export function VersionHistory({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  onRestore,
  onCompare,
  onDelete,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleCompareSelect = (versionId: string) => {
    if (compareVersions.includes(versionId)) {
      setCompareVersions(compareVersions.filter(id => id !== versionId));
    } else if (compareVersions.length < 2) {
      setCompareVersions([...compareVersions, versionId]);
    }
  };

  const handleCompare = () => {
    if (compareVersions.length === 2 && onCompare) {
      const v1 = versions.find(v => v.id === compareVersions[0])!;
      const v2 = versions.find(v => v.id === compareVersions[1])!;
      onCompare(v1, v2);
    }
  };

  const handleRestore = (version: Version) => {
    if (confirm(`Restore to version ${version.versionNumber}? This will overwrite your current diagram.`)) {
      onRestore(version);
      onClose();
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 bottom-0 w-[400px] z-50 bg-[#0d0d10] border-l border-white/[0.05] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white" />
              <h2 className="text-sm font-semibold text-white">Version History</h2>
              <span className="text-xs text-[#71717a] ml-1">{versions.length} versions</span>
            </div>
            <button
              onClick={onClose}
              className="text-[#71717a] hover:text-white hover:bg-white/[0.04] rounded-lg p-1 transition-colors"
              aria-label="Close Version History"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toolbar row */}
          {versions.length > 1 && (
            <div className="px-3 py-2 border-b border-white/[0.05] flex gap-2 items-center justify-between">
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareVersions([]);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-all duration-150",
                  compareMode
                    ? "bg-violet-600 text-white border-violet-500"
                    : "text-[#a1a1aa] border-white/[0.05] hover:bg-white/[0.04]"
                )}
              >
                <Diff className="w-3.5 h-3.5" />
                {compareMode ? 'Cancel Compare' : 'Compare Modes'}
              </button>
              {compareMode && compareVersions.length > 0 && (
                <button
                  disabled={compareVersions.length !== 2}
                  onClick={handleCompare}
                  className="px-3 py-1 rounded bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Compare ({compareVersions.length}/2)
                </button>
              )}
            </div>
          )}

          {/* Versions list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {versions.map((version) => {
              const isExpanded = expandedVersions.has(version.id);
              const isSelected = compareMode && compareVersions.includes(version.id);
              const isCurrent = currentVersionId === version.id;

              return (
                <div
                  key={version.id}
                  className={cn(
                    'group px-3 py-3 border-b border-white/[0.04] cursor-pointer transition-all',
                    isSelected ? 'bg-white/[0.04] border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02]',
                    !isSelected && 'border-l-2 border-l-transparent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for compare mode */}
                    {compareMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCompareSelect(version.id); }}
                        className={cn(
                          'mt-1 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'border-white/[0.08] hover:border-white/[0.2] bg-transparent'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    )}

                    <div className="flex-1 min-w-0" onClick={() => !compareMode && toggleExpanded(version.id)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {version.isAutoSave ? (
                          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Auto-save
                          </span>
                        ) : (
                          <span className="text-xs bg-white/[0.06] text-[#a1a1aa] px-1.5 py-0.5 rounded font-mono">
                            v{version.versionNumber}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
                            Current
                          </span>
                        )}
                        {version.tags?.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-white/[0.04] px-1.5 rounded text-[#71717a]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-[#a1a1aa] mb-2">{version.message}</p>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-[#71717a] flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.author.name}
                        </div>
                        <div className="text-[#52525b]">
                          {formatRelativeTime(version.timestamp)}
                        </div>
                        {version.changes && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400">+{version.changes.added}</span>
                            <span className="text-red-400">-{version.changes.removed}</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <div className="bg-[#09090b] rounded-lg p-3 font-mono text-xs text-[#a1a1aa] border border-white/[0.05] max-h-48 overflow-y-auto custom-scrollbar">
                              <pre className="whitespace-pre-wrap">{version.code}</pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(version.id); }}
                        className="p-1 rounded text-[#71717a] hover:text-white hover:bg-white/[0.06]"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {!compareMode && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(version); }}
                            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-white/[0.06]"
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          {onDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(version.id); }}
                              className="p-1 rounded text-[#71717a] hover:text-[#f87171] hover:bg-[#f87171]/10"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {versions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <History className="w-8 h-8 text-[#52525b] mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No history</h3>
                <p className="text-xs text-[#52525b]">Save to create history</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-white/[0.05] text-xs text-[#52525b] text-center bg-[#0a0a0d]">
            Automatically created upon saving
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function generateMockVersions(count: number = 5): Version[] {
  const versions: Version[] = [];
  const messages = [
    'Initial diagram structure',
    'Added user authentication flow',
    'Updated database schema',
    'Fixed connection arrows',
    'Added error handling paths',
    'Refactored payment flow',
    'Added notification service',
    'Optimized layout',
    'Added retry logic',
    'Final review changes',
  ];

  for (let i = count; i >= 1; i--) {
    versions.push({
      id: `v-${i}`,
      versionNumber: i,
      timestamp: new Date(Date.now() - i * 30 * 60 * 1000), 
      author: {
        name: i % 2 === 0 ? 'You' : 'Team Member',
        avatar: undefined,
      },
      message: messages[i % messages.length],
      code: `[Node${i}] --> [Process${i}]\n[Process${i}] --> (End)`,
      changes: {
        added: Math.floor(Math.random() * 10) + 1,
        removed: Math.floor(Math.random() * 5),
      },
      isAutoSave: i % 3 === 0,
      tags: i === count ? ['latest'] : undefined,
    });
  }

  return versions;
}
