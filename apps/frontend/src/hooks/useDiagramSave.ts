// E:\Skemly-ai\apps\frontend\src\hooks\useDiagramSave.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAutoSave } from './useAutoSave';
import { diagramAPI } from '@/services/api.service';
import toast from 'react-hot-toast';
import type { Node, Edge } from 'reactflow';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface DiagramSaveData {
  syntax?: string;
  nodes?: Node[];
  edges?: Edge[];
  title?: string;
}

export interface UseDiagramSaveOptions {
  diagramId: string | undefined;
  title: string;
  /** Called when the save API needs to be invoked. Defaults to using diagramAPI.update. */
  onSaveApi?: (id: string, data: DiagramSaveData) => Promise<void>;
}

export interface UseDiagramSaveReturn {
  save: (data: DiagramSaveData) => void;
  saveNow: (data?: DiagramSaveData) => Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | undefined;
  isOnline: boolean;
  hasOfflineDraft: boolean;
  syncOfflineDraft: () => Promise<void>;
  discardOfflineDraft: () => void;
  saveStatus: SaveStatus;
}

export function useDiagramSave({
  diagramId,
  title,
  onSaveApi,
}: UseDiagramSaveOptions): UseDiagramSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineDraft, setHasOfflineDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const titleRef = useRef(title);
  useEffect(() => { titleRef.current = title; }, [title]);

  // Monitor network connectivity
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setSaveStatus((s) => s === 'offline' ? 'idle' : s);
    };
    const goOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Check for offline drafts on mount / when diagramId changes
  useEffect(() => {
    if (!diagramId) return;
    const key = `offline_draft:${diagramId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.updatedAt) setHasOfflineDraft(true);
    } catch { /* ignore malformed drafts */ }
  }, [diagramId]);

  const doSave = useCallback(async (data: DiagramSaveData) => {
    if (!diagramId) return;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      if (onSaveApi) {
        await onSaveApi(diagramId, { ...data, title: titleRef.current });
      } else {
        await diagramAPI.update(diagramId, {
          title: titleRef.current,
          syntax: data.syntax,
          nodes: data.nodes,
          edges: data.edges,
        });
      }
      setLastSaved(new Date());
      setIsDirty(false);
      setSaveStatus('saved');
      // Clear any offline draft on successful save
      localStorage.removeItem(`offline_draft:${diagramId}`);
      setHasOfflineDraft(false);
      // Auto-reset 'saved' → 'idle' after 3s
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      // Persist to localStorage as an offline draft so work isn't lost
      const key = `offline_draft:${diagramId}`;
      const draft = {
        syntax: data.syntax ?? '',
        nodes: data.nodes ?? [],
        edges: data.edges ?? [],
        updatedAt: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(draft));
      setHasOfflineDraft(true);
      // Avoid toasting on every background autosave failure — surface only on explicit saves
    } finally {
      setIsSaving(false);
    }
  }, [diagramId, onSaveApi]);

  const { save: schedSave, saveNow: schedSaveNow } = useAutoSave({
    onSave: doSave,
    delay: 2500,
    maxWait: 30000,
    enabled: !!diagramId && isOnline,
  });

  const save = useCallback((data: DiagramSaveData) => {
    setIsDirty(true);
    schedSave(data);
  }, [schedSave]);

  const saveNow = useCallback(async (data?: DiagramSaveData) => {
    if (data) {
      setIsDirty(true);
      await schedSaveNow(data);
    } else {
      await schedSaveNow();
    }
  }, [schedSaveNow]);

  const syncOfflineDraft = useCallback(async () => {
    if (!diagramId) return;
    const key = `offline_draft:${diagramId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DiagramSaveData & { updatedAt: number };
      await doSave(parsed);
      localStorage.removeItem(key);
      setHasOfflineDraft(false);
      toast.success('Synced offline changes!');
    } catch {
      toast.error('Sync failed. Check your internet connection.');
    }
  }, [diagramId, doSave]);

  const discardOfflineDraft = useCallback(() => {
    if (!diagramId) return;
    localStorage.removeItem(`offline_draft:${diagramId}`);
    setHasOfflineDraft(false);
    toast.success('Discarded local changes.');
  }, [diagramId]);

  return {
    save,
    saveNow,
    isDirty,
    isSaving,
    lastSaved,
    isOnline,
    hasOfflineDraft,
    syncOfflineDraft,
    discardOfflineDraft,
    saveStatus,
  };
}
