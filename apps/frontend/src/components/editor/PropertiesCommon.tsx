import React, { ReactNode } from 'react';
import { ColorPicker } from '../ui/color-picker';
import { cn } from '@/lib/utils';

export const PAPER_PRESETS = ['#09090b', '#0a0a0d', '#0d0d10', '#18181b', '#ffffff', '#f8fafc', '#111827'];
export const NODE_FILL_PRESETS = ['#18181b', '#0d0d10', '#09090b', '#1e3a5f', '#14532d', '#3b0764', '#7f1d1d', '#ffffff'];
export const NODE_STROKE_PRESETS = ['#3f3f46', '#ffffff', '#a78bfa', '#818cf8', '#38bdf8', '#34d399', '#f472b6', '#fbbf24'];
export const NODE_TEXT_PRESETS = ['#ffffff', '#a1a1aa', '#71717a', '#000000', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24'];
export const EDGE_LINE_PRESETS = ['#3f3f46', '#ffffff', '#a78bfa', '#818cf8', '#38bdf8', '#34d399', '#f472b6', '#fbbf24'];

export const FONT_OPTIONS = [
  { value: 'inherit', label: 'Theme default' },
  { value: 'ui-sans-serif, system-ui, sans-serif', label: 'Sans-Serif' },
  { value: 'ui-serif, Georgia, serif', label: 'Serif' },
  { value: 'ui-monospace, SFMono-Regular, monospace', label: 'Monospace' },
  { value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: 'Inter' },
  { value: '"Segoe UI", Roboto, sans-serif', label: 'Segoe / Roboto' },
];

export function hexForPicker(raw: string | undefined, fallback: string): string {
  const s = String(raw || '').trim();
  if (!s || s.startsWith('var(')) return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const a = s.slice(1).split('');
    return `#${a[0]}${a[0]}${a[1]}${a[1]}${a[2]}${a[2]}`;
  }
  return fallback;
}

export function SectionTitle({ children, icon: Icon }: { children: ReactNode; icon?: any }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold text-[#a1a1aa] uppercase tracking-wider px-2 py-1.5 border-b border-white/[0.04] mb-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-[#71717a]" />}
      {children}
    </h3>
  );
}

export function InspectorSection({
  title,
  hint,
  icon,
  children,
  className,
}: {
  title: string;
  hint?: string;
  icon?: any;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-2 mb-4', className)}>
      <div>
        <SectionTitle icon={icon}>{title}</SectionTitle>
        {hint && (
          <p className="text-[10px] leading-relaxed text-[#71717a] px-2">{hint}</p>
        )}
      </div>
      <div className="space-y-1 px-1">{children}</div>
    </section>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-[#0d0d10] px-3 py-2 transition-all hover:border-white/[0.08] group">
      <div>
        <span className="text-xs font-semibold text-[#71717a] uppercase tracking-wider transition-colors group-hover:text-[#a1a1aa]">
          {label}
        </span>
        {description && (
          <p className="text-[10px] text-[#52525b] mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-all duration-200',
          checked ? 'bg-violet-600' : 'bg-[#18181b] border border-white/[0.05]'
        )}
      >
        <div
          className={cn(
            'absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-[16px]'
          )}
        />
      </div>
    </label>
  );
}

export function ColorField({
  label,
  value,
  fallback,
  onChange,
  presets,
  sublabel,
}: {
  label: string;
  sublabel?: string;
  value: string | undefined;
  fallback: string;
  onChange: (hex: string) => void;
  presets: string[];
}) {
  const safe = hexForPicker(value, fallback);
  const displayHex = value?.startsWith('var(') ? safe : value || safe;

  return (
    <div className="space-y-1.5 flex flex-col py-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">{label}</span>
          {sublabel && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#71717a] font-medium">
              {sublabel}
            </span>
          )}
        </div>
        <ColorPicker
          value={displayHex}
          onChange={onChange}
          className="w-auto border border-white/[0.05] rounded"
        />
      </div>
      
      <div className="flex flex-wrap gap-1 mt-1">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={cn(
              'h-4 w-4 rounded-[4px] border border-white/[0.1] transition-all hover:scale-110 active:scale-95',
              safe.toLowerCase() === c.toLowerCase() &&
              'ring-1 ring-violet-500 ring-offset-1 ring-offset-[#0d0d10] scale-110'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
