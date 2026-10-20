import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ITEMS, CATEGORIES, ShapeCard } from './ShapePaletteData';
import { cn } from '@/lib/utils';

interface ShapePaletteProps {
  onInsert: (snippet: string) => void;
}

export function ShapePalette({ onInsert }: ShapePaletteProps) {
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(s) ||
        (i.description && i.description.toLowerCase().includes(s)) ||
        i.category.toLowerCase().includes(s)
    );
  }, [q]);

  const byCat = (cat: string) => filtered.filter((i) => i.category === cat);
  const toggle = (key: string) => setCollapsed((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div className="flex h-full flex-col bg-[#0d0d10] text-foreground select-none">
      {/* Header Search */}
      <div className="shrink-0 border-b border-white/[0.06] p-3 bg-[#101014]">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Elements</span>
          <span className="text-[10px] tabular-nums text-zinc-600">{filtered.length}</span>
        </div>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#71717a]" />
          <input
            aria-label="Search diagram elements"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search elements…"
            className="w-full rounded-lg border border-white/[0.08] bg-black/20 py-2 pl-8 pr-3 text-xs font-medium text-white placeholder-[#71717a] focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/10 transition-all"
          />
        </div>
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-[#0d0d10]">
        {CATEGORIES.map(({ key, label }) => {
          const items = byCat(key);
          if (items.length === 0) return null;
          const isOpen = !collapsed[key];

          return (
            <div key={key} className="space-y-1.5">
              <button
                type="button"
                onClick={() => toggle(key)}
                className="flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#85858f] hover:bg-white/[0.03] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span>{label}</span>
                <span className="text-[9px] font-bold text-[#a1a1aa] bg-white/[0.04] border border-white/[0.05] px-1.5 py-0.5 rounded">
                  {items.length}
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {items.map((item) => (
                    <ShapeCard
                      key={item.id}
                      item={item}
                      onInsert={onInsert}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <Search className="w-6 h-6 text-[#52525b]" />
            <p className="text-xs font-medium text-[#a1a1aa]">No elements found</p>
            <p className="text-[11px] text-[#71717a]">Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-2.5 bg-[#101014]">
        <p className="text-[9px] text-[#71717a] text-center font-medium tracking-wide">
          Click to insert · Drag to canvas
        </p>
      </div>
    </div>
  );
}
