import { useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, Clock3 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

interface DateTimePickerProps {
  value?: string;
  onChange: (nextIso: string) => void;
  className?: string;
}

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const selected = useMemo(() => parseValue(value), [value]);

  const setDatePart = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    const base = selected ?? new Date();
    const merged = new Date(nextDate);
    merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(merged.toISOString());
  };

  const setTimePart = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const base = selected ?? new Date();
    const next = new Date(base);
    next.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    onChange(next.toISOString());
  };

  const display = selected ? format(selected, 'PPP p') : 'Select date and time';
  const timeValue = selected ? format(selected, 'HH:mm') : '12:00';

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full rounded-[14px] border border-border/60 bg-background/50 px-4 py-3 text-left text-sm',
            'transition-all hover:bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/20',
            className
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-foreground/85">{display}</span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-[10060] rounded-2xl border border-border/70 bg-card p-3 shadow-2xl backdrop-blur-xl"
        >
          <DayPicker mode="single" selected={selected} onSelect={setDatePart} />
          <div className="mt-3 border-t border-border/40 pt-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Time
            </label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimePart(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/60 bg-background/40 px-2 text-sm outline-none focus:border-primary/40"
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

