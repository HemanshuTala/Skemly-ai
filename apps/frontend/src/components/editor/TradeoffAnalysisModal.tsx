import { useEffect, useState } from 'react';
import { Modal } from '../ui/modal';
import { aiAPI } from '@/services/api.service';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, Scale, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tradeoff {
  decision: string;
  alternative: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

interface TradeoffAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
}

export function TradeoffAnalysisModal({ isOpen, onClose, diagramId }: TradeoffAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [tradeoffs, setTradeoffs] = useState<Tradeoff[]>([]);

  const fetchTradeoffs = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.tradeoffs(diagramId);
      const data = res.data?.data;
      if (data) {
        setTradeoffs(data.tradeoffs || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to analyze tradeoffs.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && diagramId) {
      fetchTradeoffs();
    }
  }, [isOpen, diagramId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Architectural Tradeoffs" size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <p className="text-[11px] font-bold text-[#52525b] uppercase tracking-widest">
              Evaluating architectural tradeoffs…
            </p>
          </div>
        ) : (
          <>
            {/* Overview Intro */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Decision Analyzer
                </h4>
                <p className="text-[12px] text-[#52525b] leading-snug">
                  Compare your current design choices against industry standards.
                </p>
              </div>
            </div>

            {/* Tradeoffs List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#52525b]">
                  Decision Tradeoffs ({tradeoffs.length})
                </h4>
                <button
                  onClick={fetchTradeoffs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
                </button>
              </div>

              <div className="space-y-4">
                {tradeoffs.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-4 hover:border-white/[0.10] transition-colors"
                  >
                    {/* Header comparison row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-white bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg">
                        {t.decision}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#52525b] shrink-0" />
                      <span className="text-[11px] font-bold text-[#a1a1aa] bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-lg">
                        {t.alternative}
                      </span>
                    </div>

                    {/* Pros and Cons splits */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Pros */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#4ade80] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Pros of decision
                        </span>
                        <ul className="space-y-1.5">
                          {t.pros.map((p, idx) => (
                            <li key={idx} className="text-xs text-[#a1a1aa] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mt-1.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#f87171] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Cons of decision
                        </span>
                        <ul className="space-y-1.5">
                          {t.cons.map((c, idx) => (
                            <li key={idx} className="text-xs text-[#a1a1aa] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] mt-1.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendation panel */}
                    <div className="rounded-lg bg-black/40 p-3.5 border border-white/[0.04] space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                        Recommendation
                      </span>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed">
                        {t.recommendation}
                      </p>
                    </div>
                  </div>
                ))}

                {tradeoffs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/[0.08] bg-white/[0.01] rounded-xl gap-2 text-center">
                    <Scale className="w-6 h-6 text-[#52525b]" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      No decisions analyzed yet
                    </p>
                    <p className="text-xs text-[#52525b]">Add components and connection lines to generate tradeoff insights.</p>
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
