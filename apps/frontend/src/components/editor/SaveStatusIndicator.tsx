// E:\Skemly-ai\apps\frontend\src\components\editor\SaveStatusIndicator.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | undefined;
  isDirty: boolean;
  isOnline: boolean;
  saveStatus: SaveStatus;
  className?: string;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SaveStatusIndicator({
  isSaving,
  lastSaved,
  isDirty,
  isOnline,
  saveStatus,
  className,
}: SaveStatusIndicatorProps) {
  const show = saveStatus !== 'idle' || isDirty || !isOnline;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={saveStatus + String(isDirty) + String(isOnline)}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-medium select-none',
            className
          )}
        >
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#71717a]" />
              <span className="text-[#71717a]">Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3 h-3 text-[#4ade80]" />
              <span className="text-[#4ade80]">
                {lastSaved ? `Saved ${formatRelativeTime(lastSaved)}` : 'Saved'}
              </span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-[#f87171]" />
              <span className="text-[#f87171]">Save failed</span>
            </>
          )}
          {saveStatus === 'offline' && (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400">Offline</span>
            </>
          )}
          {saveStatus === 'idle' && isDirty && isOnline && (
            <>
              <Clock className="w-3 h-3 text-[#52525b]" />
              <span className="text-[#52525b]">Unsaved changes</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
