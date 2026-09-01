import { useEffect, useState } from 'react';
import { Modal } from '../ui/modal';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Trash2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { Requirement } from '@/services/api.service';
import { cn } from '@/lib/utils';

interface RequirementsTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: Requirement[];
  onSaveRequirements: (reqs: Requirement[]) => void;
  nodes: any[];
}

export function RequirementsTraceabilityModal({
  isOpen,
  onClose,
  requirements,
  onSaveRequirements,
  nodes,
}: RequirementsTraceabilityModalProps) {
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReqs(requirements || []);
    }
  }, [isOpen, requirements]);

  // Compute coverage mapping
  const coverageMap: Record<string, string[]> = {};
  reqs.forEach((r) => {
    coverageMap[r.id] = [];
  });

  nodes.forEach((node) => {
    const nodeReqs: string[] = node.data?.requirements || [];
    nodeReqs.forEach((reqId) => {
      if (coverageMap[reqId]) {
        coverageMap[reqId].push(node.data?.label || node.id);
      }
    });
  });

  const handleAdd = () => {
    const id = newId.trim().toUpperCase();
    const title = newTitle.trim();
    if (!id || !title) {
      toast.error('Requirement ID and Title are required');
      return;
    }

    if (reqs.some((r) => r.id === id)) {
      toast.error(`Requirement with ID ${id} already exists`);
      return;
    }

    const updated = [...reqs, { id, title, description: newDesc.trim() }];
    setReqs(updated);
    onSaveRequirements(updated);
    
    setNewId('');
    setNewTitle('');
    setNewDesc('');
    toast.success('Requirement added');
  };

  const handleDelete = (id: string) => {
    const updated = reqs.filter((r) => r.id !== id);
    setReqs(updated);
    onSaveRequirements(updated);
    toast.success('Requirement deleted');
  };

  const filteredReqs = reqs.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Traceability Matrix" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[70vh] overflow-hidden pr-1">
        {/* Left Side: Create & List */}
        <div className="lg:col-span-7 flex flex-col min-h-0 space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 shrink-0">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#52525b]">
              Define New Requirement
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="ID (e.g. REQ-1)"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
              />
              <input
                placeholder="Requirement Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-2 h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Detailed description of requirement (optional)…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
              />
              <button 
                onClick={handleAdd} 
                className="h-9 px-4 rounded-lg bg-white text-[#09090b] text-[11px] font-bold uppercase tracking-wider hover:bg-[#e4e4e7] transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#52525b]" />
            <input
              placeholder="Search requirements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] custom-scrollbar">
            {filteredReqs.map((r) => {
              const coveredBy = coverageMap[r.id] || [];
              const isCovered = coveredBy.length > 0;

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 flex items-start justify-between gap-3 group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white font-bold uppercase tracking-wider">
                        {r.id}
                      </span>
                      <h5 className="text-xs font-bold text-white truncate">{r.title}</h5>
                    </div>
                    {r.description && (
                      <p className="text-[11px] text-[#52525b] leading-normal pr-4">
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {isCovered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                          <span className="text-[10px] font-semibold text-[#4ade80] truncate max-w-[220px]">
                            Covered: {coveredBy.join(', ')}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-[#f87171] shrink-0" />
                          <span className="text-[9px] font-bold text-[#f87171] uppercase tracking-wide">
                            Unmapped requirement
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#52525b] hover:text-[#f87171] hover:bg-[#f87171]/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete requirement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {filteredReqs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/[0.08] bg-white/[0.01] rounded-xl gap-2 text-center">
                <ClipboardList className="w-8 h-8 text-[#52525b]" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  No requirements defined
                </p>
                <p className="text-xs text-[#52525b]">Define requirements above to map your architecture.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Analysis & Coverage */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/[0.05] pt-4 lg:pt-0 lg:pl-6 flex flex-col space-y-4 min-h-0">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#52525b]">
            Coverage Analysis
          </h4>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.01] space-y-1">
              <span className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">Total Reqs</span>
              <p className="text-2xl font-bold text-white">{reqs.length}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.01] space-y-1">
              <span className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">Unmapped</span>
              <p className="text-2xl font-bold text-[#f87171]">
                {reqs.filter((r) => (coverageMap[r.id] || []).length === 0).length}
              </p>
            </div>
          </div>

          {/* Coverage meter */}
          {reqs.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] p-4 bg-[#0a0a0d] space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Overall Coverage</span>
                <span className="font-bold text-[#4ade80]">
                  {Math.round(
                    ((reqs.length - reqs.filter((r) => (coverageMap[r.id] || []).length === 0).length) /
                      reqs.length) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((reqs.length - reqs.filter((r) => (coverageMap[r.id] || []).length === 0).length) /
                        reqs.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Unmapped alerts */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar min-h-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#52525b]">
              Traceability Matrix
            </span>
            <div className="space-y-1 divide-y divide-white/[0.04]">
              {reqs.map((r) => {
                const count = (coverageMap[r.id] || []).length;
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs py-2 first:pt-0">
                    <span className="font-semibold text-[#a1a1aa] pr-2 truncate">{r.id}: {r.title}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border',
                        count > 0 
                          ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]' 
                          : 'bg-[#f87171]/10 border-[#f87171]/20 text-[#f87171]'
                      )}
                    >
                      {count} {count === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
