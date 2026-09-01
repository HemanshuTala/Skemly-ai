// E:\Skemly-ai\apps\frontend\src\hooks\useAutoSave.ts
import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number;
  maxWait?: number;
  enabled?: boolean;
}

export function useAutoSave({
  onSave,
  delay = 2500,
  maxWait,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstCallTimeRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const pendingDataRef = useRef<any>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const MIN_SAVE_INTERVAL = 2000;

  const doSave = useCallback(async () => {
    if (!pendingDataRef.current || isSavingRef.current) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
      const remaining = MIN_SAVE_INTERVAL - timeSinceLastSave;
      timeoutRef.current = setTimeout(() => doSave(), remaining);
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      lastSaveTimeRef.current = Date.now();
      await onSave(pendingDataRef.current);
    } catch (error) {
      // Caller handles errors
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [onSave]);

  const saveNow = useCallback(async (data?: any) => {
    if (!enabled) return;
    if (isSavingRef.current) {
      if (data !== undefined) pendingDataRef.current = data;
      return;
    }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (maxWaitRef.current) { clearTimeout(maxWaitRef.current); maxWaitRef.current = null; }
    firstCallTimeRef.current = null;
    if (data !== undefined) pendingDataRef.current = data;
    await doSave();
  }, [enabled, doSave]);

  const save = useCallback(
    async (data: any) => {
      if (!enabled) return;

      pendingDataRef.current = data;

      if (firstCallTimeRef.current === null) {
        firstCallTimeRef.current = Date.now();
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const elapsed = Date.now() - (firstCallTimeRef.current || 0);
      const remainingMaxWait = maxWait ? Math.max(0, maxWait - elapsed) : null;
      const actualDelay = remainingMaxWait !== null
        ? Math.min(delay, remainingMaxWait)
        : delay;

      timeoutRef.current = setTimeout(async () => {
        firstCallTimeRef.current = null;
        if (maxWaitRef.current) { clearTimeout(maxWaitRef.current); maxWaitRef.current = null; }
        if (isSavingRef.current) {
          firstCallTimeRef.current = Date.now();
          save(data);
          return;
        }
        await doSave();
      }, actualDelay);

      if (maxWait && !maxWaitRef.current) {
        maxWaitRef.current = setTimeout(async () => {
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          firstCallTimeRef.current = null;
          maxWaitRef.current = null;
          if (isSavingRef.current) {
            firstCallTimeRef.current = Date.now();
            save(pendingDataRef.current);
            return;
          }
          await doSave();
        }, maxWait);
      }
    },
    [onSave, delay, maxWait, enabled, doSave]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxWaitRef.current) clearTimeout(maxWaitRef.current);
    };
  }, []);

  return { save, saveNow, isSaving };
}
