import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  X,
  RotateCcw,
  GitCommit,
  Clock,
  User,
  MessageSquare,
  Check,
  ChevronRight,
  ChevronDown,
  Eye,
  Diff,
  Trash2,
  MoreHorizontal,
  Download,
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
  currentCode,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Version History</h2>
              <p className="text-xs text-[#71717a]">{versions.length} versions saved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {versions.length > 1 && (
              <Button
                variant={compareMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareVersions([]);
                }}
                leftIcon={<Diff className="w-4 h-4" />}
              >
                {compareMode ? 'Cancel Compare' : 'Compare'}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compare action bar */}
        <AnimatePresence>
          {compareMode && compareVersions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 border-b border-[#27272a] bg-[#27272a]/50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#a1a1aa]">
                  Selected: {compareVersions.length}/2 versions
                </p>
                <Button
                  size="sm"
                  disabled={compareVersions.length !== 2}
                  onClick={handleCompare}
                >
                  Compare Selected
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Versions list */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-[#27272a]">
            {versions.map((version, index) => {
              const isExpanded = expandedVersions.has(version.id);
              const isSelected = compareMode && compareVersions.includes(version.id);
              const isCurrent = currentVersionId === version.id;

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'group px-6 py-4 transition-colors',
                    isSelected && 'bg-white/5',
                    !isSelected && 'hover:bg-[#27272a]/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection checkbox in compare mode */}
                    {compareMode && (
                      <button
                        onClick={() => handleCompareSelect(version.id)}
                        className={cn(
                          'mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-white border-white text-[#18181b]'
                            : 'border-[#3f3f46] hover:border-white'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Version number/avatar */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
                        isCurrent
                          ? 'bg-white text-[#18181b]'
                          : 'bg-[#27272a] border border-[#3f3f46] text-white'
                      )}>
                        {version.isAutoSave ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          version.versionNumber
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white">
                          {version.isAutoSave ? 'Auto-save' : `Version ${version.versionNumber}`}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium">
                            Current
                          </span>
                        )}
                        {version.tags?.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-[#3f3f46] text-[#a1a1aa] text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-[#a1a1aa] mb-2">{version.message}</p>

                      <div className="flex items-center gap-4 text-xs text-[#71717a]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          {version.author.name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(version.timestamp)}
                        </div>
                        {version.changes && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">+{version.changes.added}</span>
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
                            className="mt-4 overflow-hidden"
                          >
                            <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-4">
                              <pre className="text-xs font-mono text-[#52525b] line-clamp-10">
                                {version.code}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleExpanded(version.id)}
                        className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a]"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      {!compareMode && (
                        <>
                          <button
                            onClick={() => handleRestore(version)}
                            className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a]"
                            title="Restore this version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          {onDelete && (
                            <button
                              onClick={() => onDelete(version.id)}
                              className="p-2 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-500/10"
                              title="Delete version"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {versions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <History className="w-12 h-12 text-[#3f3f46] mb-4" />
              <p className="text-lg font-semibold text-white mb-1">No versions yet</p>
              <p className="text-sm text-[#71717a]">Save your diagram to create a version history</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
          <p className="text-xs text-[#71717a]">
            Versions are automatically saved every 5 minutes
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Mock data generator for testing
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
      timestamp: new Date(Date.now() - i * 30 * 60 * 1000), // 30 min intervals
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
