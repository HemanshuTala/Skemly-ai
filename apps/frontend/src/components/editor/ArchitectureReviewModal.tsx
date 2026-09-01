import { useEffect, useState } from 'react';
import { Modal } from '../ui/modal';
import { aiAPI } from '@/services/api.service';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Finding {
  nodeIds: string[];
  severity: 'info' | 'success' | 'warning' | 'error';
  code: string;
  description: string;
  suggestion: string;
}

interface Scorecard {
  scalability: number;
  availability: number;
  security: number;
  observability: number;
  simplicity: number;
  overall: number;
}

interface ArchitectureReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
}

export function ArchitectureReviewModal({ isOpen, onClose, diagramId }: ArchitectureReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState('');

  const fetchReview = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.review(diagramId);
      const data = res.data?.data;
      if (data) {
        setScorecard(data.scorecard);
        setFindings(data.findings || []);
        setSummary(data.summary || '');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to review architecture.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && diagramId) {
      fetchReview();
    }
  }, [isOpen, diagramId]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20';
    if (score >= 5) return 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20';
    return 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20';
  };

  const getSeverityIcon = (sev: Finding['severity']) => {
    switch (sev) {
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-[#f87171] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#fbbf24] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#60a5fa] shrink-0" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Architecture Scorecard" size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <p className="text-[11px] font-bold text-[#52525b] uppercase tracking-widest">
              Reviewing system design…
            </p>
          </div>
        ) : (
          <>
            {/* Scorecard Metrics */}
            {scorecard && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {[
                  { label: 'Overall', val: scorecard.overall },
                  { label: 'Scalability', val: scorecard.scalability },
                  { label: 'Availability', val: scorecard.availability },
                  { label: 'Security', val: scorecard.security },
                  { label: 'Observability', val: scorecard.observability },
                  { label: 'Simplicity', val: scorecard.simplicity },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className={cn(
                      "rounded-xl border p-3 flex flex-col items-center justify-center text-center transition-all",
                      label === 'Overall' ? getScoreColor(val) : 'bg-white/[0.02] border-white/[0.05]'
                    )}
                  >
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#52525b]">
                      {label}
                    </span>
                    <span className="text-xl font-bold mt-1 text-white">{val}/10</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#52525b] mb-1.5">
                  Executive Summary
                </h4>
                <p className="text-xs leading-relaxed text-[#a1a1aa]">{summary}</p>
              </div>
            )}

            {/* Findings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#52525b]">
                  Findings & Suggestions ({findings.length})
                </h4>
                <button
                  onClick={fetchReview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
                </button>
              </div>

              <div className="space-y-2">
                {findings.map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-4 flex gap-3 items-start transition-all hover:bg-white/[0.02]",
                      f.severity === 'error'
                        ? 'border-[#f87171]/20 bg-[#f87171]/5'
                        : f.severity === 'warning'
                        ? 'border-[#fbbf24]/20 bg-[#fbbf24]/5'
                        : 'border-white/[0.05] bg-white/[0.02]'
                    )}
                  >
                    {getSeverityIcon(f.severity)}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">
                          {f.description}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 font-bold uppercase tracking-wider text-[#52525b] border border-white/[0.04]">
                          {f.code}
                        </span>
                      </div>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed">
                        <span className="font-semibold text-white">Suggestion:</span> {f.suggestion}
                      </p>
                      {f.nodeIds && f.nodeIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[9px] text-[#52525b] font-semibold uppercase tracking-wider">Affected:</span>
                          {f.nodeIds.map(nid => (
                            <span key={nid} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[#a1a1aa]">
                              {nid}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {findings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/[0.08] bg-white/[0.01] rounded-xl gap-2 text-center">
                    <CheckCircle2 className="w-6 h-6 text-[#4ade80]" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      Zero issues found!
                    </p>
                    <p className="text-xs text-[#52525b]">This system architecture design looks robust.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
