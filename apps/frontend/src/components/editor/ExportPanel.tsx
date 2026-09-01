import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  Image as ImageIcon,
  Check,
  Loader2,
  Link as LinkIcon,
  Code,
  FileJson,
  File,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat = 'png' | 'svg' | 'json';
export type ExportArea = 'full' | 'viewport' | 'selection';
export type ExportBackground = 'transparent' | 'dark' | 'light';
export type ExportQuality = '1x' | '2x' | '3x';

export interface ExportOptions {
  format: ExportFormat;
  area: ExportArea;
  quality: ExportQuality;
  background: ExportBackground;
  padding: number;
  filename: string;
}

type ExportStep = 'idle' | 'preparing' | 'rendering' | 'downloading' | 'done' | 'error';

const STEP_LABELS: Record<ExportStep, string> = {
  idle: '',
  preparing: 'Preparing…',
  rendering: 'Rendering…',
  downloading: 'Downloading…',
  done: 'Export complete',
  error: 'Export failed',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagramTitle: string;
  diagramCode: string;
  onExport: (options: ExportOptions) => Promise<string>;
  onExportSVG?: () => Promise<string>;
  onCopyLink?: () => Promise<void>;
  hasSelection?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'diagram'
  );
}

const FORMAT_ICONS: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  png: ImageIcon,
  svg: File,
  json: FileJson,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportPanel({
  isOpen,
  onClose,
  diagramTitle,
  diagramCode,
  onExport,
  onExportSVG,
  onCopyLink,
  hasSelection = false,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [area, setArea] = useState<ExportArea>('full');
  const [quality, setQuality] = useState<ExportQuality>('2x');
  const [background, setBackground] = useState<ExportBackground>('dark');
  const [padding, setPadding] = useState(32);
  const [filename, setFilename] = useState(() => sanitizeFilename(diagramTitle));
  const [step, setStep] = useState<ExportStep>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isExporting = step === 'preparing' || step === 'rendering' || step === 'downloading';

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setStep('preparing');
    setErrorMessage('');
    abortRef.current = new AbortController();

    try {
      const safeFilename = sanitizeFilename(filename || diagramTitle);
      const options: ExportOptions = { format, area, quality, background, padding, filename: safeFilename };

      // JSON export — synchronous, no rendering needed
      if (format === 'json') {
        setStep('downloading');
        const blob = new Blob([diagramCode], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStep('done');
        return;
      }

      // SVG export
      if (format === 'svg' && onExportSVG) {
        setStep('rendering');
        const svgContent = await onExportSVG();
        setStep('downloading');
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        setStep('done');
        return;
      }

      // PNG export
      setStep('rendering');
      const dataUrl = await onExport(options);
      setPreviewUrl(dataUrl);
      setStep('downloading');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeFilename}.png`;
      a.click();
      setStep('done');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStep('idle');
        return;
      }
      const isMemory = err?.message?.toLowerCase().includes('memory') || err?.message?.toLowerCase().includes('large');
      setErrorMessage(
        isMemory
          ? 'Diagram too large at this quality. Try a lower resolution.'
          : 'Could not export this architecture. Try a lower quality or smaller area.'
      );
      setStep('error');
    }
  }, [format, area, quality, background, padding, filename, diagramTitle, diagramCode, onExport, onExportSVG, isExporting]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStep('idle');
  }, []);

  const handleRetry = useCallback(() => {
    setStep('idle');
    setErrorMessage('');
    setPreviewUrl(null);
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!onCopyLink) return;
    await onCopyLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [onCopyLink]);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(diagramCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [diagramCode]);

  if (!isOpen) return null;

  const scaleMultiplier = { '1x': 1, '2x': 2, '3x': 3 }[quality];
  const showSizeWarning = format === 'png' && scaleMultiplier >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] rounded-2xl border border-white/[0.08] bg-[#0d0d10] shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-[#0a0a0d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white tracking-tight">Export Architecture</h2>
              <p className="text-[11px] text-[#52525b] truncate max-w-[220px]">{diagramTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Format ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'svg', 'json'] as ExportFormat[]).map((f) => {
                const Icon = FORMAT_ICONS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all',
                      format === f
                        ? 'bg-white text-[#09090b] shadow-lg'
                        : 'bg-white/[0.03] text-[#71717a] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {f.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Export Area ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Export Area</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'full', label: 'Full' },
                { v: 'viewport', label: 'Viewport' },
                { v: 'selection', label: 'Selection', disabled: !hasSelection },
              ] as { v: ExportArea; label: string; disabled?: boolean }[]).map(({ v, label, disabled }) => (
                <button
                  key={v}
                  onClick={() => !disabled && setArea(v)}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all',
                    area === v && !disabled
                      ? 'bg-white text-[#09090b] shadow-lg'
                      : 'bg-white/[0.03] text-[#71717a] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white',
                    disabled && 'opacity-30 cursor-not-allowed hover:bg-white/[0.03] hover:text-[#71717a]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── PNG-only options ── */}
          <AnimatePresence>
            {format === 'png' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Quality */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Quality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1x', '2x', '3x'] as ExportQuality[]).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all',
                          quality === q
                            ? 'bg-white text-[#09090b] shadow-lg'
                            : 'bg-white/[0.03] text-[#71717a] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  {showSizeWarning && (
                    <p className="text-[10px] text-amber-400/80 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      3× may use significant memory on large diagrams.
                    </p>
                  )}
                </div>

                {/* Background */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Background</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'transparent'] as ExportBackground[]).map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setBackground(bg)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-semibold tracking-wide capitalize transition-all',
                          background === bg
                            ? 'bg-white text-[#09090b] shadow-lg'
                            : 'bg-white/[0.03] text-[#71717a] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
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
                    <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Padding</label>
                    <span className="text-[11px] text-[#71717a] tabular-nums">{padding}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={64}
                    step={4}
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full accent-white h-1"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Filename ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Filename</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(sanitizeFilename(e.target.value))}
                placeholder="diagram-name"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[#52525b] outline-none focus:border-white/20 transition-colors"
              />
              <span className="text-[11px] text-[#52525b] shrink-0">.{format}</span>
            </div>
          </div>

          {/* ── Preview thumbnail ── */}
          <AnimatePresence>
            {previewUrl && format === 'png' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.1em]">Preview</label>
                <div
                  className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#09090b] flex items-center justify-center"
                  style={{ maxHeight: 120 }}
                >
                  <img
                    src={previewUrl}
                    alt="Export preview"
                    className="max-w-full max-h-[120px] object-contain"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error state ── */}
          <AnimatePresence>
            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="flex-1 text-[12px] text-red-300 font-medium min-w-0">{errorMessage}</p>
                <button
                  onClick={handleRetry}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer actions ── */}
        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={isExporting ? handleCancel : step === 'done' ? onClose : handleExport}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[12px] font-bold transition-all shadow-lg',
              step === 'done'
                ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30 hover:bg-[#22c55e]/30'
                : step === 'error'
                  ? 'bg-white text-[#09090b] hover:bg-[#e4e4e7]'
                  : isExporting
                    ? 'bg-white/[0.06] text-[#71717a] border border-white/[0.08] hover:bg-white/[0.1]'
                    : 'bg-white text-[#09090b] hover:bg-[#e4e4e7]'
            )}
          >
            {step === 'done' ? (
              <><Check className="w-3.5 h-3.5" /> Downloaded — Close</>
            ) : step === 'error' ? (
              <><Download className="w-3.5 h-3.5" /> Try Again</>
            ) : isExporting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {STEP_LABELS[step]} — Click to cancel</>
            ) : (
              <><Download className="w-3.5 h-3.5" /> Export {format.toUpperCase()}</>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#a1a1aa] text-[11px] font-semibold hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              {copiedCode
                ? <><Check className="w-3.5 h-3.5 text-[#4ade80]" /> Copied</>
                : <><Code className="w-3.5 h-3.5" /> Copy Code</>}
            </button>
            {onCopyLink && (
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#a1a1aa] text-[11px] font-semibold hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                {copiedLink
                  ? <><Check className="w-3.5 h-3.5 text-[#4ade80]" /> Copied</>
                  : <><LinkIcon className="w-3.5 h-3.5" /> Share Link</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
