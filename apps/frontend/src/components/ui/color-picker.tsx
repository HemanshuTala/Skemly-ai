import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Pipette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function normalizeHex(value: string): string {
  const v = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [r, g, b] = v.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#ffffff';
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [text, setText] = useState(normalizeHex(value));
  const normalized = normalizeHex(value);

  useEffect(() => {
    setText(normalizeHex(value));
  }, [value]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-white/[0.10] shadow-sm transition-all hover:scale-105 hover:border-white/[0.20]"
            style={{ backgroundColor: normalized }}
            aria-label="Pick color"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            className="z-[10060] rounded-xl border border-white/[0.08] bg-[#0d0d10] p-3 shadow-xl backdrop-blur-xl"
          >
            <HexColorPicker color={normalized} onChange={onChange} />
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
              <Pipette className="h-3 w-3" />
              Live color preview
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <input
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (/^#[0-9a-fA-F]{3,6}$/.test(next)) {
            onChange(normalizeHex(next));
          }
        }}
        className="h-8 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 font-mono text-[11px] outline-none focus:border-white/[0.20] focus:bg-white/[0.03] text-white"
        spellCheck={false}
      />
    </div>
  );
}

