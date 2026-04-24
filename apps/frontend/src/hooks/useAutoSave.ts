import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number;
  maxWait?: number;
  enabled?: boolean;
}

export function useAutoSave({ onSave, delay = 1000, maxWait, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstCallTimeRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const pendingDataRef = useRef<any>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const MIN_SAVE_INTERVAL = 2000; // Minimum 2 seconds between saves

  const doSave = useCallback(async () => {
    if (!pendingDataRef.current || isSavingRef.current) return;
    
    // Check minimum save interval
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
      // Reschedule for later if too soon
      const remaining = MIN_SAVE_INTERVAL - timeSinceLastSave;
      timeoutRef.current = setTimeout(() => {
        doSave();
      }, remaining);
      return;
    }
    
    try {
      isSavingRef.current = true;
      lastSaveTimeRef.current = Date.now();
      await onSave(pendingDataRef.current);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const saveNow = useCallback(async (data?: any) => {
    if (!enabled) return;
    if (isSavingRef.current) {
      // If already saving, queue the data and wait
      if (data !== undefined) {
        pendingDataRef.current = data;
      }
      return;
    }
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitRef.current) {
      clearTimeout(maxWaitRef.current);
      maxWaitRef.current = null;
    }
    firstCallTimeRef.current = null;
    
    // If data provided, update pending data
    if (data !== undefined) {
      pendingDataRef.current = data;
    }
    
    await doSave();
  }, [enabled, doSave]);

  const save = useCallback(
    async (data: any) => {
      if (!enabled) return;

      // Store the data for when we actually save
      pendingDataRef.current = data;

      // Track first call time for maxWait
      if (firstCallTimeRef.current === null) {
        firstCallTimeRef.current = Date.now();
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Calculate remaining maxWait time
      const elapsed = Date.now() - (firstCallTimeRef.current || 0);
      const remainingMaxWait = maxWait ? Math.max(0, maxWait - elapsed) : null;

      // Use the shorter of delay or remaining maxWait
      const actualDelay = remainingMaxWait !== null 
        ? Math.min(delay, remainingMaxWait)
        : delay;

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        // Reset first call time when we actually save
        firstCallTimeRef.current = null;
        if (maxWaitRef.current) {
          clearTimeout(maxWaitRef.current);
          maxWaitRef.current = null;
        }
        
        if (isSavingRef.current) {
          // If already saving, re-schedule this one to ensure the latest data is saved
          firstCallTimeRef.current = Date.now();
          save(data);
          return;
        }
        await doSave();
      }, actualDelay);

      // Set maxWait timeout if provided and not already set
      if (maxWait && !maxWaitRef.current) {
        maxWaitRef.current = setTimeout(async () => {
          // Clear the regular timeout since we're saving now
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Reset first call time
          firstCallTimeRef.current = null;
          maxWaitRef.current = null;
          
          if (isSavingRef.current) {
            // If already saving, re-schedule with fresh data
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

  // Cleanup on unmount - save any pending data
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitRef.current) {
        clearTimeout(maxWaitRef.current);
      }
    };
  }, []);

  return { save, saveNow, isSaving: isSavingRef.current };
}
