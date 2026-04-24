import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  X,
  Image as ImageIcon,
  Check,
  Copy,
  Loader2,
  Settings,
  ChevronRight,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ExportOptions {
  quality: '1x' | '2x' | '4x';
  background: 'transparent' | 'white' | 'dark';
  padding: number;
}

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagramTitle: string;
  diagramCode: string;
  onExport: (options: ExportOptions) => Promise<string>;
  onCopyLink?: () => Promise<string>;
}

const QUALITY_OPTIONS = [
  { value: '1x' as const, label: 'Standard (1x)', scale: 1 },
  { value: '2x' as const, label: 'Retina (2x)', scale: 2 },
  { value: '4x' as const, label: 'Ultra HD (4x)', scale: 4 },
];

export function ExportPanel({
  isOpen,
  onClose,
  diagramTitle,
  diagramCode,
  onExport,
  onCopyLink,
}: ExportPanelProps) {
  const [options, setOptions] = useState<ExportOptions>({
    quality: '2x',
    background: 'transparent',
    padding: 20,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const url = await onExport(options);
      setExportUrl(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [options, onExport]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(diagramCode);
    setCopiedFormat('code');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyLink = async () => {
    if (onCopyLink) {
      await onCopyLink();
      setCopiedFormat('link');
      setTimeout(() => setCopiedFormat(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Export PNG</h2>
              <p className="text-xs text-[#71717a]">{diagramTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quality Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((quality) => (
                <button
                  key={quality.value}
                  onClick={() => setOptions({ ...options, quality: quality.value })}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                    options.quality === quality.value
                      ? 'bg-white text-[#18181b] shadow-lg'
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                  )}
                >
                  {quality.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Background</label>
            <div className="flex gap-2">
              {(['transparent', 'white', 'dark'] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() => setOptions({ ...options, background: bg })}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all',
                    options.background === bg
                      ? 'bg-white text-[#18181b]'
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                  )}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">Padding</label>
              <span className="text-xs text-[#71717a]">{options.padding}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.padding}
              onChange={(e) => setOptions({ ...options, padding: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Copy Code / Link */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#27272a] bg-[#27272a]/50 hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors text-sm"
            >
              {copiedFormat === 'code' ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            {onCopyLink && (
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#27272a] bg-[#27272a]/50 hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors text-sm"
              >
                {copiedFormat === 'link' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Export Success */}
          {exportUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-green-500/30 bg-green-500/10"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Export ready!</p>
                  <p className="text-xs text-[#71717a]">{diagramTitle}.png</p>
                </div>
                <a
                  href={exportUrl}
                  download={`${diagramTitle}.png`}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-xs font-medium"
                >
                  Download
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#27272a] bg-[#18181b]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            leftIcon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
